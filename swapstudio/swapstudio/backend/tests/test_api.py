import json
import subprocess
import time

import pytest
from fastapi.testclient import TestClient
from PIL import Image


@pytest.fixture()
def client(tmp_path, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "comfy_mock", True)
    monkeypatch.setattr(config.settings, "data_dir", tmp_path / "data")
    monkeypatch.setattr(config.settings, "workflow_path", tmp_path / "missing.json")
    monkeypatch.setattr(config.settings, "max_video_seconds", 2.0)
    import importlib
    from app import main
    importlib.reload(main)
    from app.comfy import MockComfy
    with TestClient(main.app) as c:
        c.app.state.runner.comfy = MockComfy(delay=0.01, steps=3)
        c.app.state.comfy = c.app.state.runner.comfy
        yield c


@pytest.fixture()
def media(tmp_path):
    img = tmp_path / "char.jpg"
    Image.new("RGB", (512, 768), (200, 80, 40)).save(img)
    vid = tmp_path / "src.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "testsrc=size=320x568:rate=24",
                    "-t", "3", "-pix_fmt", "yuv420p", str(vid)], check=True)
    return img, vid


def wait_done(client, job_id, timeout=20):
    end = time.time() + timeout
    while time.time() < end:
        job = client.get(f"/api/jobs/{job_id}").json()
        if job["status"] in ("done", "error"):
            return job
        time.sleep(0.05)
    raise AssertionError("job did not finish")


def test_full_job_in_mock_mode(client, media):
    img, vid = media
    with img.open("rb") as fi, vid.open("rb") as fv:
        r = client.post("/api/jobs", data={"fields": json.dumps({"footwear": "barefoot"}), "seed": "7"},
                        files={"character": ("c.jpg", fi, "image/jpeg"), "video": ("v.mp4", fv, "video/mp4")})
    assert r.status_code == 201, r.text
    job = r.json()
    assert job["seed"] == 7
    assert job["duration"] == 2.0  # 3s source trimmed to max 2s
    assert "barefoot" in job["prompt"]
    done = wait_done(client, job["id"])
    assert done["status"] == "done", done
    assert client.get(f"/api/jobs/{job['id']}/files/output").status_code == 200
    assert client.get(f"/api/jobs/{job['id']}/files/character").headers["content-type"] == "image/png"

    r2 = client.post(f"/api/jobs/{job['id']}/retry")
    assert r2.status_code == 201 and r2.json()["prompt"] == job["prompt"]
    assert wait_done(client, r2.json()["id"])["status"] == "done"
    assert len(client.get("/api/jobs").json()) == 2


def test_rejects_bad_files(client, media, tmp_path):
    img, _ = media
    bad = tmp_path / "x.txt"
    bad.write_text("hi")
    with img.open("rb") as fi, bad.open("rb") as fb:
        r = client.post("/api/jobs", files={"character": ("c.jpg", fi), "video": ("x.txt", fb)})
    assert r.status_code == 400


def test_public_mode_blocks_uploads(client, media, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "public_mode", True)
    img, vid = media
    with img.open("rb") as fi, vid.open("rb") as fv:
        r = client.post("/api/jobs", files={"character": ("c.jpg", fi), "video": ("v.mp4", fv)})
    assert r.status_code == 403


def test_access_code(client, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "access_codes", "abc123")
    assert client.get("/api/auth/check").status_code == 401
    assert client.get("/api/auth/check", headers={"X-Access-Code": "abc123"}).status_code == 200


def test_health(client):
    h = client.get("/api/health").json()
    assert h["mock"] and h["comfy_online"] and h["workflow_ok"]
