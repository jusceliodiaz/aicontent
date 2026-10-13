# Starts the SwapStudio backend on Windows (ComfyUI must already be running on 127.0.0.1:8188)
Set-Location "$PSScriptRoot\..\backend"
if (-not (Test-Path .venv)) { python -m venv .venv; .\.venv\Scripts\pip install -r requirements.txt }
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
