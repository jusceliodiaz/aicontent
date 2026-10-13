"""Tiny SQLite job store (stdlib only)."""
from __future__ import annotations

import json
import sqlite3
import threading
import time
from pathlib import Path

_SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    created_at REAL NOT NULL,
    status TEXT NOT NULL,            -- queued | running | done | error
    progress REAL NOT NULL DEFAULT 0,
    message TEXT NOT NULL DEFAULT '',
    prompt TEXT NOT NULL,
    fields TEXT NOT NULL,
    seed INTEGER NOT NULL,
    duration REAL NOT NULL,
    character_file TEXT NOT NULL,
    video_file TEXT NOT NULL,
    output_file TEXT,
    error TEXT,
    started_at REAL,
    finished_at REAL,
    access_code TEXT
);
"""


class JobStore:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._lock = threading.Lock()
        with self._lock:
            self._conn.executescript(_SCHEMA)
            # Jobs interrupted by a restart can't resume: mark them failed.
            self._conn.execute(
                "UPDATE jobs SET status='error', error='Server restarted' WHERE status IN ('queued','running')"
            )
            self._conn.commit()

    def create(self, **job) -> None:
        job.setdefault("created_at", time.time())
        job["fields"] = json.dumps(job.get("fields", {}))
        cols = ",".join(job)
        with self._lock:
            self._conn.execute(f"INSERT INTO jobs ({cols}) VALUES ({','.join('?' * len(job))})", list(job.values()))
            self._conn.commit()

    def update(self, job_id: str, **fields) -> None:
        sets = ",".join(f"{k}=?" for k in fields)
        with self._lock:
            self._conn.execute(f"UPDATE jobs SET {sets} WHERE id=?", [*fields.values(), job_id])
            self._conn.commit()

    def get(self, job_id: str) -> dict | None:
        with self._lock:
            row = self._conn.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
        return _row(row) if row else None

    def list(self, limit: int = 50) -> list[dict]:
        with self._lock:
            rows = self._conn.execute("SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
        return [_row(r) for r in rows]

    def count_since(self, access_code: str, since: float) -> int:
        with self._lock:
            return self._conn.execute(
                "SELECT COUNT(*) FROM jobs WHERE access_code=? AND created_at>=?", (access_code, since)
            ).fetchone()[0]

    def queue_position(self, job_id: str) -> int:
        with self._lock:
            row = self._conn.execute("SELECT created_at FROM jobs WHERE id=?", (job_id,)).fetchone()
            if not row:
                return 0
            return self._conn.execute(
                "SELECT COUNT(*) FROM jobs WHERE status='queued' AND created_at<?", (row[0],)
            ).fetchone()[0]


def _row(r: sqlite3.Row) -> dict:
    d = dict(r)
    d["fields"] = json.loads(d["fields"] or "{}")
    d.pop("access_code", None)
    return d
