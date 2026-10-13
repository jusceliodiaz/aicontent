# SwapStudio

A dashboard for running your **MiniMax H3 Character Swap** workflow without opening ComfyUI.

```
React dashboard  →  FastAPI (port 8000)  →  ComfyUI 127.0.0.1:8188 (never exposed)
```

- **React (Vite + TS):** upload or pick a preset, prompt built from fields, live progress, synced before/after (side by side or wipe), history, and "run again with a new seed".
- **FastAPI:** validates files, measures and trims the video, strips EXIF from the image, patches the workflow **by node title** (never by ID), runs a queue of 1 job per GPU, relays progress via SSE, and stores everything in SQLite.
- **Public mode:** invite codes, a daily limit per code, and presets only (no free uploads).

---

## 1. Prepare the workflow (once)

`workflows/character_swap.ui.json` is your workflow with these titles already set:

| Title | Node | Backend changes |
|---|---|---|
| `IN_PROMPT` | MiniMaxH3ReferenceToVideo | prompt |
| `IN_IMAGE` | LoadImage | character |
| `IN_VIDEO` | VHS_LoadVideo | source video |
| `IN_DURATION` | Float (duration) | **real duration of the video** (it was fixed at 10 s) |
| `IN_SEED` | RandomNoise | seed |
| `OUT_VIDEO` | VHS_VideoCombine | output prefix |

1. Open `workflows/character_swap.ui.json` in ComfyUI.
2. **Workflow → Export (API)** → save it as `workflows/character_swap.api.json`.
3. If you edit the graph later, keep the titles and export again. The backend re-reads the file on every job, so you don't need to restart.

> If something doesn't match (for example the prompt field of the H3 node has an unexpected name), `GET /api/health` and the red banner in the dashboard say exactly which node and field are the problem.

## 2. Backend

Requirements: Python 3.10+ and **ffmpeg on the PATH** (`ffprobe -version` must work).

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # edit as needed
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Or use `deploy/run-windows.ps1` / `deploy/run-linux.sh`.

**Without a GPU (to work on the front end):** `COMFY_MOCK=true` in `.env`. Jobs simulate 20 steps and the "result" is a copy of the original video.

Tests: `pip install -r requirements-dev.txt && pytest` (13 tests, including the real ComfyUI client against a fake server over HTTP and WebSocket).

## 3. Dashboard

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173  (proxies /api to :8000)
```

## 4. Presets (required for the public demo)

```
presets/
  presets.json            ← copy from presets.example.json
  characters/xxx.png
  videos/yyy.mp4
```

Each video preset sets `target` (who to replace), and each character preset sets `description`. Those fields are filled in automatically.

---

## 5. Putting it on your portfolio

### Layer A: case study (always online)
On the portfolio page: before/after videos, a screenshot of the graph, the diagram above, and real numbers (time per second of video, VRAM). Add a 30–60 s screen recording of the dashboard. This works even with your PC turned off.

### Layer B: live demo (optional, invite only)

**Option 1, a single origin (simplest):**
```bash
cd frontend && npm run build      # generates frontend/dist
```
FastAPI serves `dist/` automatically at `/`. Publish **only port 8000** with a Cloudflare Tunnel:

```bash
cloudflared tunnel login
cloudflared tunnel create swapstudio
cloudflared tunnel route dns swapstudio swap.seusite.com
cloudflared tunnel run swapstudio       # config in deploy/cloudflared-config.example.yml
```
On the portfolio: a link or `<iframe src="https://swap.seusite.com">`.

**Option 2, front end on Vercel/Netlify, API through the tunnel:**
- Front end: `VITE_API_URL=https://api.seusite.com` (and `VITE_BASE=/lab/swap/` if it lives under a sub-path).
- Backend: `CORS_ORIGINS=https://seusite.com`.

**`.env` for the public demo:**
```
PUBLIC_MODE=true
ACCESS_CODES=recruiter-abc,studio-xyz
JOBS_PER_CODE_PER_DAY=5
MAX_VIDEO_SECONDS=5
```

When your PC is off, the dashboard shows "GPU server offline" and keeps the history visible (with option 2, history depends on the API being up, so the case study page is your fallback).

### Security checklist
- [ ] ComfyUI listening on `127.0.0.1` (do **not** use `--listen 0.0.0.0`).
- [ ] The tunnel only points to `:8000`.
- [ ] `PUBLIC_MODE=true` + `ACCESS_CODES` set before sharing the link.
- [ ] Presets made only from material you own or have a license/consent for. No public videos of real people.
- [ ] `backend/data/` (jobs and outputs) stays out of git.

---

## API

| Method | Route | What it does |
|---|---|---|
| GET | `/api/health` | ComfyUI status, workflow, mode, limits, queue |
| GET | `/api/presets` | characters and videos |
| POST | `/api/prompt/preview` | prompt generated from the fields |
| POST | `/api/jobs` | multipart: `character`/`video` **or** `character_preset`/`video_preset`, `fields` (JSON), `seed?`, `prompt_override?` |
| GET | `/api/jobs` · `/api/jobs/{id}` | history / status |
| GET | `/api/jobs/{id}/events` | SSE with progress |
| GET | `/api/jobs/{id}/files/{character\|source\|output}` | files |
| POST | `/api/jobs/{id}/retry` | same inputs, new seed |

## Known limitations
- Tested in mock mode and against a fake ComfyUI, **not yet against the real H3**. On the first real run, check `/api/health` and the backend log.
- Jobs that are queued or running when the backend restarts are marked as errors (no resume).
- One GPU = one job at a time. With two GPUs, run two ComfyUI instances and two runners.
