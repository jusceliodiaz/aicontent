#!/usr/bin/env bash
# Starts the SwapStudio backend (ComfyUI must already be running on 127.0.0.1:8188)
set -euo pipefail
cd "$(dirname "$0")/../backend"
[ -d .venv ] || { python3 -m venv .venv; .venv/bin/pip install -r requirements.txt; }
exec .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
