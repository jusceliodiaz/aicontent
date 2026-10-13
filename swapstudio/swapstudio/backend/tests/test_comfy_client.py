"""Run the real ComfyClient against a fake ComfyUI server (HTTP + WebSocket)."""
import asyncio
import socket
import threading
import time

import pytest
import uvicorn
from fastapi import FastAPI, File, Form, UploadFile, WebSocket
from fastapi.responses import Response

from app.comfy import ComfyClient, ComfyError, pick_video


def make_fake(fail=False):
    app = FastAPI()
    state = {"ws": None, "uploads": [], "graph": None}

    @app.get("/system_stats")
    def stats():
        return {"ok": True}

    @app.post("/upload/image")
    async def upload(image: UploadFile = File(...), type: str = Form("input"), overwrite: str = Form("")):
        state["uploads"].append(image.filename)
        return {"name": image.filename, "subfolder": "", "type": "input"}

    @app.websocket("/ws")
    async def ws(sock: WebSocket):
        await sock.accept()
        state["ws"] = sock
        try:
            while True:
                await sock.receive_text()
        except Exception:
            pass

    @app.post("/prompt")
    async def prompt(body: dict):
        state["graph"] = body["prompt"]
        pid = "p1"

        async def emit():
            sock = state["ws"]
            await sock.send_json({"type": "executing", "data": {"node": "155", "prompt_id": pid}})
            for i in (1, 2):
                await sock.send_bytes(b"\x00preview")
                await sock.send_json({"type": "progress", "data": {"value": i, "max": 2, "prompt_id": pid}})
            if fail:
                await sock.send_json({"type": "execution_error", "data": {"prompt_id": pid, "node_type": "VAEDecode",
                                                                          "exception_message": "CUDA OOM"}})
            else:
                await sock.send_json({"type": "executing", "data": {"node": None, "prompt_id": pid}})
        asyncio.get_event_loop().create_task(emit())
        return {"prompt_id": pid}

    @app.get("/history/{pid}")
    def history(pid: str):
        return {pid: {"outputs": {"151": {"gifs": [
            {"filename": "x_00001.mp4", "subfolder": "swapstudio", "type": "output"},
            {"filename": "x_00001-audio.mp4", "subfolder": "swapstudio", "type": "output"}]}}}}

    @app.get("/view")
    def view(filename: str, subfolder: str, type: str):
        return Response(f"{subfolder}/{filename}".encode(), media_type="video/mp4")

    return app, state


def serve(app):
    s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
    server = uvicorn.Server(uvicorn.Config(app, port=port, log_level="error"))
    threading.Thread(target=server.run, daemon=True).start()
    while not server.started:
        time.sleep(0.02)
    return server, f"http://127.0.0.1:{port}"


@pytest.mark.parametrize("fail", [False, True])
def test_client_roundtrip(tmp_path, fail):
    app, state = make_fake(fail)
    server, url = serve(app)
    try:
        c = ComfyClient(url)
        src = tmp_path / "a.png"; src.write_bytes(b"png")
        progress = []

        async def go():
            assert await c.health()
            assert await c.upload(src, "swap_char.png") == "swap_char.png"
            async def cb(f, m): progress.append(f)
            outputs = await c.run({"1": {}}, cb, timeout=10)
            f = pick_video(outputs)
            assert f["filename"] == "x_00001-audio.mp4"
            await c.download(f, tmp_path / "out.mp4")

        if fail:
            with pytest.raises(ComfyError, match="CUDA OOM"):
                asyncio.run(go())
        else:
            asyncio.run(go())
            assert (tmp_path / "out.mp4").read_bytes() == b"swapstudio/x_00001-audio.mp4"
            assert progress[-1] == 1.0
    finally:
        server.should_exit = True
