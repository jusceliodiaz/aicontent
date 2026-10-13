"""SwapStudio API: the only thing the dashboard (or the internet) talks to.
ComfyUI stays on 127.0.0.1 behind this gateway."""
from __future__ import annotations

import asyncio
import json
import logging
import random
import shutil
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import ValidationError

from .comfy import ComfyClient, MockComfy
from .config import settings
from .db import JobStore
from .jobs import JobRunner
from .media import IMAGE_EXT, VIDEO_EXT, MediaError, check_image, clean_image, normalize_video, probe_video
from .prompting import PromptFields, build_prompt
from .workflow import WorkflowError, load_workflow, validate_workflow

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("swapstudio")

JOBS_DIR = settings.data_dir / "jobs"


def get_workflow() -> dict:
    if settings.comfy_mock and not settings.workflow_path.exists():
        return _MOCK_WORKFLOW
    return load_workflow(settings.workflow_path)


@asynccontextmanager
async def lifespan(app: FastAPI):
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    store = JobStore(settings.data_dir / "jobs.sqlite3")
    comfy = MockComfy() if settings.comfy_mock else ComfyClient(settings.comfy_url)
    runner = JobRunner(store, comfy, get_workflow, JOBS_DIR, settings.job_timeout_seconds)
    app.state.store, app.state.comfy, app.state.runner = store, comfy, runner
    try:
        validate_workflow(get_workflow())
        log.info("Workflow OK: %s", settings.workflow_path)
    except WorkflowError as e:
        log.warning("Workflow problem: %s", e)
    runner.start()
    yield
    await runner.stop()


app = FastAPI(title="SwapStudio", version="1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Access-Code"],
)


# ---------- auth ----------

def access_code(x_access_code: str | None = Header(default=None)) -> str:
    codes = settings.access_code_set
    if not codes:
        return ""
    if not x_access_code or x_access_code not in codes:
        raise HTTPException(401, "Invalid or missing access code.")
    return x_access_code


# ---------- presets ----------

def load_presets() -> dict:
    f = settings.presets_dir / "presets.json"
    if not f.exists():
        return {"characters": [], "videos": []}
    return json.loads(f.read_text(encoding="utf-8"))


def preset_file(kind: str, preset_id: str) -> tuple[Path, dict]:
    for p in load_presets().get(kind, []):
        if p["id"] == preset_id:
            path = (settings.presets_dir / p["file"]).resolve()
            if settings.presets_dir.resolve() not in path.parents or not path.exists():
                raise HTTPException(500, f"Preset file missing: {p['file']}")
            return path, p
    raise HTTPException(400, f"Unknown {kind[:-1]} preset '{preset_id}'.")


# ---------- routes ----------

@app.get("/api/health")
async def health(request: Request):
    wf_ok, wf_error = True, None
    try:
        validate_workflow(get_workflow())
    except WorkflowError as e:
        wf_ok, wf_error = False, str(e)
    return {
        "comfy_online": await request.app.state.comfy.health(),
        "mock": settings.comfy_mock,
        "workflow_ok": wf_ok,
        "workflow_error": wf_error,
        "public_mode": settings.public_mode,
        "uploads_allowed": not settings.public_mode,
        "auth_required": bool(settings.access_code_set),
        "max_video_seconds": settings.max_video_seconds,
        "max_upload_mb": settings.max_upload_mb,
        "queue_size": request.app.state.runner.queue.qsize(),
    }


@app.get("/api/auth/check")
async def auth_check(_: str = Depends(access_code)):
    return {"ok": True}


@app.get("/api/presets")
async def presets():
    data = load_presets()
    for kind in ("characters", "videos"):
        for p in data.get(kind, []):
            p["url"] = f"/api/presets/{kind}/{p['id']}/file"
    return data


@app.get("/api/presets/{kind}/{preset_id}/file")
async def preset_download(kind: str, preset_id: str):
    if kind not in ("characters", "videos"):
        raise HTTPException(404)
    path, _ = preset_file(kind, preset_id)
    return FileResponse(path)


@app.post("/api/prompt/preview")
async def prompt_preview(fields: PromptFields):
    return {"prompt": build_prompt(fields)}


async def _save_upload(up: UploadFile, dest: Path, allowed: set[str]) -> None:
    ext = Path(up.filename or "").suffix.lower()
    if ext not in allowed:
        raise HTTPException(400, f"File type {ext or '?'} not allowed. Use: {', '.join(sorted(allowed))}")
    limit = settings.max_upload_mb * 1024 * 1024
    size = 0
    with dest.open("wb") as fh:
        while chunk := await up.read(1024 * 1024):
            size += len(chunk)
            if size > limit:
                fh.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(413, f"File larger than {settings.max_upload_mb} MB.")
            fh.write(chunk)


@app.post("/api/jobs", status_code=201)
async def create_job(
    request: Request,
    fields: str = Form("{}"),
    seed: int | None = Form(None),
    prompt_override: str | None = Form(None),
    character_preset: str | None = Form(None),
    video_preset: str | None = Form(None),
    character: UploadFile | None = File(None),
    video: UploadFile | None = File(None),
    code: str = Depends(access_code),
):
    store: JobStore = request.app.state.store

    if code and settings.jobs_per_code_per_day:
        if store.count_since(code, time.time() - 86400) >= settings.jobs_per_code_per_day:
            raise HTTPException(429, "Daily limit reached for this access code.")

    if settings.public_mode and (character or video or prompt_override):
        raise HTTPException(403, "Public demo: only preset characters and videos are allowed.")

    try:
        pf = PromptFields(**json.loads(fields or "{}"))
    except (ValueError, ValidationError) as e:
        raise HTTPException(422, f"Invalid prompt fields: {e}") from e

    job_id = uuid.uuid4().hex
    jdir = JOBS_DIR / job_id
    jdir.mkdir(parents=True)
    try:
        # character image
        raw_img = jdir / "character_raw"
        if character:
            await _save_upload(character, raw_img, IMAGE_EXT)
        elif character_preset:
            src, meta = preset_file("characters", character_preset)
            shutil.copy(src, raw_img)
            if not pf.character and meta.get("description"):
                pf.character = meta["description"]
        else:
            raise HTTPException(400, "Send a character image or choose a character preset.")
        check_image(raw_img)
        clean_image(raw_img, jdir / "character.png")
        raw_img.unlink(missing_ok=True)

        # source video
        raw_vid = jdir / "source_raw.mp4"
        if video:
            await _save_upload(video, raw_vid, VIDEO_EXT)
        elif video_preset:
            src, meta = preset_file("videos", video_preset)
            shutil.copy(src, raw_vid)
            if meta.get("target") and "target" not in json.loads(fields or "{}"):
                pf.target = meta["target"]
        else:
            raise HTTPException(400, "Send a source video or choose a video preset.")
        info = probe_video(raw_vid)
        if info["duration"] < settings.min_video_seconds:
            raise HTTPException(400, f"Video shorter than {settings.min_video_seconds}s.")
        duration = info["duration"]
        too_long = duration > settings.max_video_seconds
        if too_long or info["codec"] != "h264":
            # cut to the limit and/or convert to H.264 so browsers and ComfyUI read it the same way
            normalize_video(raw_vid, jdir / "source.mp4", settings.max_video_seconds if too_long else None)
            raw_vid.unlink(missing_ok=True)
            duration = min(duration, settings.max_video_seconds)
        else:
            raw_vid.rename(jdir / "source.mp4")
    except HTTPException:
        shutil.rmtree(jdir, ignore_errors=True)
        raise
    except MediaError as e:
        shutil.rmtree(jdir, ignore_errors=True)
        raise HTTPException(400, str(e)) from e

    prompt = (prompt_override or "").strip() or build_prompt(pf)
    if len(prompt) > 4000:
        raise HTTPException(400, "Prompt too long.")

    store.create(
        id=job_id, status="queued", message="waiting for GPU", prompt=prompt, fields=pf.model_dump(),
        seed=seed if seed is not None else random.randint(1, 2**31 - 1), duration=round(duration, 3),
        character_file="character.png", video_file="source.mp4", access_code=code or None,
    )
    await request.app.state.runner.submit(job_id)
    return store.get(job_id)


@app.get("/api/jobs")
async def list_jobs(request: Request, limit: int = 50):
    return request.app.state.store.list(min(limit, 200))


def _job_or_404(request: Request, job_id: str) -> dict:
    job = request.app.state.store.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    job["queue_position"] = request.app.state.store.queue_position(job_id) if job["status"] == "queued" else 0
    return job


@app.get("/api/jobs/{job_id}")
async def get_job(request: Request, job_id: str):
    return _job_or_404(request, job_id)


@app.get("/api/jobs/{job_id}/events")
async def job_events(request: Request, job_id: str):
    _job_or_404(request, job_id)
    runner: JobRunner = request.app.state.runner

    async def stream():
        while True:
            ev = runner.notifier.event(job_id)
            job = _job_or_404(request, job_id)
            yield f"data: {json.dumps(job)}\n\n"
            if job["status"] in ("done", "error") or await request.is_disconnected():
                return
            try:
                await asyncio.wait_for(ev.wait(), timeout=15)
            except asyncio.TimeoutError:
                yield ": keepalive\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


FILES = {"character": "character.png", "source": "source.mp4", "output": "output.mp4"}


@app.get("/api/jobs/{job_id}/files/{kind}")
async def job_file(request: Request, job_id: str, kind: str):
    _job_or_404(request, job_id)
    if kind not in FILES:
        raise HTTPException(404)
    path = JOBS_DIR / job_id / FILES[kind]
    if not path.exists():
        raise HTTPException(404, "File not ready.")
    return FileResponse(path)


@app.post("/api/jobs/{job_id}/retry", status_code=201)
async def retry_job(request: Request, job_id: str, code: str = Depends(access_code)):
    """Same inputs and prompt, new seed."""
    old = _job_or_404(request, job_id)
    store: JobStore = request.app.state.store
    if code and settings.jobs_per_code_per_day:
        if store.count_since(code, time.time() - 86400) >= settings.jobs_per_code_per_day:
            raise HTTPException(429, "Daily limit reached for this access code.")
    new_id = uuid.uuid4().hex
    ndir = JOBS_DIR / new_id
    ndir.mkdir(parents=True)
    for name in ("character.png", "source.mp4"):
        shutil.copy(JOBS_DIR / job_id / name, ndir / name)
    store.create(
        id=new_id, status="queued", message="waiting for GPU", prompt=old["prompt"], fields=old["fields"],
        seed=random.randint(1, 2**31 - 1), duration=old["duration"],
        character_file="character.png", video_file="source.mp4", access_code=code or None,
    )
    await request.app.state.runner.submit(new_id)
    return store.get(new_id)


# Optional: serve the built dashboard from the same origin (one tunnel for everything).
_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _DIST.exists():
    from fastapi.staticfiles import StaticFiles

    app.mount("/", StaticFiles(directory=_DIST, html=True), name="dashboard")


# Used only in mock mode when no exported workflow exists yet.
_MOCK_WORKFLOW = {
    "1": {"class_type": "MiniMaxH3ReferenceToVideo", "_meta": {"title": "IN_PROMPT"}, "inputs": {"prompt": ""}},
    "2": {"class_type": "LoadImage", "_meta": {"title": "IN_IMAGE"}, "inputs": {"image": ""}},
    "3": {"class_type": "VHS_LoadVideo", "_meta": {"title": "IN_VIDEO"}, "inputs": {"video": ""}},
    "4": {"class_type": "PrimitiveFloat", "_meta": {"title": "IN_DURATION"}, "inputs": {"value": 1.0}},
    "5": {"class_type": "RandomNoise", "_meta": {"title": "IN_SEED"}, "inputs": {"noise_seed": 1}},
    "6": {"class_type": "VHS_VideoCombine", "_meta": {"title": "OUT_VIDEO"}, "inputs": {"filename_prefix": "x"}},
}
