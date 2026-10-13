"""Single-GPU job queue: one job at a time, progress broadcast to SSE listeners."""
from __future__ import annotations

import asyncio
import logging
import time
from pathlib import Path

from .comfy import ComfyError, pick_video
from .db import JobStore
from .workflow import SwapParams, build_prompt_graph

log = logging.getLogger("swapstudio.jobs")


class Notifier:
    """Wakes SSE listeners when a job changes."""

    def __init__(self):
        self._events: dict[str, asyncio.Event] = {}

    def event(self, job_id: str) -> asyncio.Event:
        return self._events.setdefault(job_id, asyncio.Event())

    def notify(self, job_id: str) -> None:
        ev = self._events.pop(job_id, None)
        if ev:
            ev.set()


class JobRunner:
    def __init__(self, store: JobStore, comfy, workflow_loader, jobs_dir: Path, timeout: int):
        self.store, self.comfy, self.load_workflow = store, comfy, workflow_loader
        self.jobs_dir, self.timeout = jobs_dir, timeout
        self.queue: asyncio.Queue[str] = asyncio.Queue()
        self.notifier = Notifier()
        self._task: asyncio.Task | None = None

    def start(self) -> None:
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()

    async def submit(self, job_id: str) -> None:
        await self.queue.put(job_id)
        self.notifier.notify(job_id)

    def _set(self, job_id: str, **fields) -> None:
        self.store.update(job_id, **fields)
        self.notifier.notify(job_id)

    async def _loop(self) -> None:
        while True:
            job_id = await self.queue.get()
            try:
                await self._run(job_id)
            except Exception as e:  # noqa: BLE001
                log.exception("job %s failed", job_id)
                self._set(job_id, status="error", error=str(e)[:1000], finished_at=time.time())
            finally:
                self.queue.task_done()

    async def _run(self, job_id: str) -> None:
        job = self.store.get(job_id)
        if not job:
            return
        jdir = self.jobs_dir / job_id
        self._set(job_id, status="running", started_at=time.time(), message="uploading inputs", progress=0)

        base = self.load_workflow()  # re-read each job so edits to the workflow apply without restart
        image_name = await self.comfy.upload(jdir / job["character_file"], f"swap_{job_id[:8]}_character.png")
        video_name = await self.comfy.upload(jdir / job["video_file"], f"swap_{job_id[:8]}_source.mp4")

        graph = build_prompt_graph(base, SwapParams(
            prompt=job["prompt"], image_name=image_name, video_name=video_name,
            duration=job["duration"], seed=job["seed"], output_prefix=f"swapstudio/{job_id[:8]}",
        ))

        last = {"t": 0.0}

        async def on_progress(frac: float, msg: str) -> None:
            now = time.monotonic()
            if now - last["t"] > 0.4 or frac >= 1:
                last["t"] = now
                self._set(job_id, progress=round(frac, 4), message=msg)

        try:
            outputs = await self.comfy.run(graph, on_progress, self.timeout)
            self._set(job_id, message="downloading result", progress=1)
            await self.comfy.download(pick_video(outputs), jdir / "output.mp4")
        except ComfyError as e:
            self._set(job_id, status="error", error=str(e), finished_at=time.time())
            return
        self._set(job_id, status="done", output_file="output.mp4", message="done", finished_at=time.time())
