"""Input validation helpers (ffprobe for video duration, Pillow for images)."""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp"}
VIDEO_EXT = {".mp4", ".mov", ".webm", ".m4v"}


class MediaError(Exception):
    pass


def probe_video(path: Path) -> dict:
    if not shutil.which("ffprobe"):
        raise MediaError("ffprobe not found. Install ffmpeg and make sure it is on PATH.")
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,codec_name:format=duration", "-of", "json", str(path)],
        capture_output=True, text=True, timeout=30,
    )
    if out.returncode != 0:
        raise MediaError("Could not read the video file.")
    info = json.loads(out.stdout)
    streams = info.get("streams") or []
    if not streams:
        raise MediaError("The file has no video stream.")
    return {
        "duration": float(info.get("format", {}).get("duration", 0) or 0),
        "width": int(streams[0].get("width", 0)),
        "height": int(streams[0].get("height", 0)),
        "codec": streams[0].get("codec_name", ""),
    }


def normalize_video(src: Path, dest: Path, seconds: float | None = None) -> None:
    """Re-encode to browser-friendly H.264 MP4, optionally keeping only the first `seconds`."""
    cut = ["-t", f"{seconds:.3f}"] if seconds else []
    out = subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(src), *cut,
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-movflags", "+faststart", str(dest)],
        capture_output=True, text=True, timeout=300,
    )
    if out.returncode != 0:
        raise MediaError(f"Could not convert video: {out.stderr[-300:]}")


def check_image(path: Path, min_side: int = 256) -> dict:
    try:
        with Image.open(path) as im:
            im.verify()
        with Image.open(path) as im:
            w, h = im.size
    except Exception as e:  # noqa: BLE001
        raise MediaError("Invalid image file.") from e
    if min(w, h) < min_side:
        raise MediaError(f"Image too small ({w}x{h}); minimum side is {min_side}px.")
    return {"width": w, "height": h}


def clean_image(src: Path, dest: Path) -> None:
    """Apply EXIF rotation, then save as PNG without metadata (location, camera data)."""
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
        im.save(dest, "PNG")
