"""Settings loaded from environment variables / backend/.env."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    # ComfyUI (never exposed to the internet; only this backend talks to it)
    comfy_url: str = "http://127.0.0.1:8188"
    comfy_mock: bool = False  # True = simulate jobs without a GPU/ComfyUI

    # Workflow exported with "Export (API)" from workflows/character_swap.ui.json
    workflow_path: Path = ROOT_DIR / "workflows" / "character_swap.api.json"

    # Storage
    data_dir: Path = BACKEND_DIR / "data"
    presets_dir: Path = ROOT_DIR / "presets"

    # Limits
    max_upload_mb: int = 80
    max_video_seconds: float = 6.0
    min_video_seconds: float = 1.0
    job_timeout_seconds: int = 1800

    # Public / portfolio mode
    public_mode: bool = False  # True = only preset characters/videos, no uploads
    access_codes: str = ""  # comma-separated; empty = no auth
    jobs_per_code_per_day: int = 5
    cors_origins: str = "http://localhost:5173"

    @property
    def access_code_set(self) -> set[str]:
        return {c.strip() for c in self.access_codes.split(",") if c.strip()}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
