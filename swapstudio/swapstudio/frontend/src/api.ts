export const API = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export type JobStatus = "queued" | "running" | "done" | "error";

export interface PromptFields {
  target: string;
  character: string;
  footwear: string;
  keep_text: boolean;
  extra: string;
}

export interface Job {
  id: string;
  created_at: number;
  status: JobStatus;
  progress: number;
  message: string;
  prompt: string;
  fields: PromptFields;
  seed: number;
  duration: number;
  output_file: string | null;
  error: string | null;
  started_at: number | null;
  finished_at: number | null;
  queue_position?: number;
}

export interface Health {
  comfy_online: boolean;
  mock: boolean;
  workflow_ok: boolean;
  workflow_error: string | null;
  public_mode: boolean;
  uploads_allowed: boolean;
  auth_required: boolean;
  max_video_seconds: number;
  max_upload_mb: number;
  queue_size: number;
}

export interface Preset {
  id: string;
  name: string;
  file: string;
  url: string;
  description?: string;
  target?: string;
}

export interface Presets {
  characters: Preset[];
  videos: Preset[];
}

const CODE_KEY = "swapstudio.code";

export function getCode(): string {
  try {
    return localStorage.getItem(CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setCode(code: string) {
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    /* storage unavailable */
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const code = getCode();
  if (code) headers.set("X-Access-Code", code);
  const r = await fetch(API + path, { ...init, headers });
  if (!r.ok) {
    let detail = r.statusText;
    try {
      const body = await r.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* not json */
    }
    throw new Error(detail || `HTTP ${r.status}`);
  }
  return r.json();
}

export const api = {
  health: () => req<Health>("/api/health"),
  checkCode: () => req<{ ok: boolean }>("/api/auth/check"),
  presets: () => req<Presets>("/api/presets"),
  jobs: () => req<Job[]>("/api/jobs"),
  job: (id: string) => req<Job>(`/api/jobs/${id}`),
  preview: (fields: PromptFields) =>
    req<{ prompt: string }>("/api/prompt/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    }),
  create: (form: FormData) => req<Job>("/api/jobs", { method: "POST", body: form }),
  retry: (id: string) => req<Job>(`/api/jobs/${id}/retry`, { method: "POST" }),
  fileUrl: (id: string, kind: "character" | "source" | "output") => `${API}/api/jobs/${id}/files/${kind}`,
  presetUrl: (p: Preset) => API + p.url,
  events: (id: string) => new EventSource(`${API}/api/jobs/${id}/events`),
};
