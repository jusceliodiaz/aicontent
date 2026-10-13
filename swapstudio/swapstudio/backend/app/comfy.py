"""Minimal ComfyUI client: upload, queue prompt, follow progress over WS, fetch output."""
from __future__ import annotations

import asyncio
import json
import shutil
import uuid
from pathlib import Path
from typing import Awaitable, Callable

import httpx
import websockets

ProgressCb = Callable[[float, str], Awaitable[None]]


class ComfyError(Exception):
    pass


class ComfyClient:
    def __init__(self, base_url: str):
        self.base = base_url.rstrip("/")
        self.ws_base = self.base.replace("http://", "ws://").replace("https://", "wss://")
        self.client_id = str(uuid.uuid4())

    async def health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as c:
                r = await c.get(f"{self.base}/system_stats")
                return r.status_code == 200
        except httpx.HTTPError:
            return False

    async def upload(self, path: Path, name: str) -> str:
        async with httpx.AsyncClient(timeout=120) as c:
            with path.open("rb") as fh:
                r = await c.post(
                    f"{self.base}/upload/image",
                    files={"image": (name, fh, "application/octet-stream")},
                    data={"type": "input", "overwrite": "true"},
                )
        if r.status_code != 200:
            raise ComfyError(f"Upload failed ({r.status_code}): {r.text[:300]}")
        info = r.json()
        sub = info.get("subfolder") or ""
        return f"{sub}/{info['name']}" if sub else info["name"]

    async def run(self, graph: dict, on_progress: ProgressCb, timeout: int) -> dict:
        """Queue the graph and wait for completion. Returns the history entry outputs."""
        async with websockets.connect(
            f"{self.ws_base}/ws?clientId={self.client_id}", max_size=None
        ) as ws:
            async with httpx.AsyncClient(timeout=30) as c:
                r = await c.post(f"{self.base}/prompt", json={"prompt": graph, "client_id": self.client_id})
            if r.status_code != 200:
                raise ComfyError(f"/prompt rejected ({r.status_code}): {r.text[:800]}")
            prompt_id = r.json()["prompt_id"]
            await on_progress(0.0, "queued in ComfyUI")

            async def follow():
                async for raw in ws:
                    if isinstance(raw, bytes):
                        continue  # binary latent previews
                    msg = json.loads(raw)
                    data = msg.get("data", {})
                    if data.get("prompt_id") not in (None, prompt_id):
                        continue
                    kind = msg.get("type")
                    if kind == "progress" and data.get("max"):
                        await on_progress(data["value"] / data["max"], f"sampling {data['value']}/{data['max']}")
                    elif kind == "executing" and data.get("node") is None and data.get("prompt_id") == prompt_id:
                        return
                    elif kind == "execution_success":
                        return
                    elif kind == "execution_error":
                        raise ComfyError(
                            f"{data.get('node_type')}: {data.get('exception_message', 'execution error')}".strip()
                        )
                    elif kind == "execution_interrupted":
                        raise ComfyError("Interrupted in ComfyUI")

            try:
                await asyncio.wait_for(follow(), timeout=timeout)
            except asyncio.TimeoutError as e:
                raise ComfyError(f"Timed out after {timeout}s") from e

        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.get(f"{self.base}/history/{prompt_id}")
        entry = r.json().get(prompt_id, {})
        return entry.get("outputs", {})

    async def download(self, file_info: dict, dest: Path) -> None:
        params = {
            "filename": file_info["filename"],
            "subfolder": file_info.get("subfolder", ""),
            "type": file_info.get("type", "output"),
        }
        async with httpx.AsyncClient(timeout=300) as c:
            async with c.stream("GET", f"{self.base}/view", params=params) as r:
                if r.status_code != 200:
                    raise ComfyError(f"/view failed ({r.status_code})")
                with dest.open("wb") as fh:
                    async for chunk in r.aiter_bytes():
                        fh.write(chunk)


def pick_video(outputs: dict) -> dict:
    """VHS_VideoCombine reports files under 'gifs'; core nodes use 'videos'/'images'.
    Prefer the '-audio' mp4 when present."""
    files: list[dict] = []
    for node_out in outputs.values():
        for key in ("gifs", "videos", "video", "images"):
            files += [f for f in node_out.get(key, []) if isinstance(f, dict) and "filename" in f]
    mp4s = [f for f in files if f["filename"].lower().endswith((".mp4", ".webm", ".mov"))]
    if not mp4s:
        raise ComfyError(f"No video in outputs: {[f['filename'] for f in files]}")
    with_audio = [f for f in mp4s if "-audio" in f["filename"]]
    return (with_audio or mp4s)[-1]


class MockComfy:
    """Simulates a run (for development / demo without GPU). Output = copy of the source video."""

    def __init__(self, delay: float = 0.25, steps: int = 20):
        self.delay, self.steps = delay, steps
        self._source: Path | None = None

    async def health(self) -> bool:
        return True

    async def upload(self, path: Path, name: str) -> str:
        if path.suffix.lower() in (".mp4", ".mov", ".webm", ".m4v"):
            self._source = path
        return name

    async def run(self, graph: dict, on_progress: ProgressCb, timeout: int) -> dict:
        await on_progress(0.0, "queued (mock)")
        for i in range(1, self.steps + 1):
            await asyncio.sleep(self.delay)
            await on_progress(i / self.steps, f"sampling {i}/{self.steps} (mock)")
        return {"mock": {"gifs": [{"filename": "mock-audio.mp4", "source": str(self._source)}]}}

    async def download(self, file_info: dict, dest: Path) -> None:
        shutil.copy(file_info["source"], dest)
