import { useCallback, useEffect, useState } from "react";
import { api, getCode, Health, Job, Presets, setCode } from "./api";
import NewJobForm from "./components/NewJobForm";
import JobView from "./components/JobView";
import Gallery from "./components/Gallery";
import AccessGate from "./components/AccessGate";

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [offline, setOffline] = useState(false);
  const [presets, setPresets] = useState<Presets>({ characters: [], videos: [] });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  const refreshJobs = useCallback(() => {
    api.jobs().then(setJobs).catch(() => {});
  }, []);

  useEffect(() => {
    const load = () =>
      api
        .health()
        .then((h) => {
          setHealth(h);
          setOffline(false);
        })
        .catch(() => setOffline(true));
    load();
    api.presets().then(setPresets).catch(() => {});
    refreshJobs();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [refreshJobs]);

  useEffect(() => {
    if (!health) return;
    if (!health.auth_required) return setAuthed(true);
    if (getCode()) api.checkCode().then(() => setAuthed(true)).catch(() => setCode(""));
  }, [health]);

  const onCreated = (job: Job) => {
    setSelected(job.id);
    refreshJobs();
  };

  const selectedJob = jobs.find((j) => j.id === selected) ?? null;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            ⇄
          </span>
          <div>
            <h1>SwapStudio</h1>
            <p>Character replacement · MiniMax H3 on ComfyUI</p>
          </div>
        </div>
        <StatusPills health={health} offline={offline} />
      </header>

      {offline && (
        <div className="banner warn">
          The GPU server is offline right now. Browse previous results below, or come back later.
        </div>
      )}
      {health && !health.workflow_ok && <div className="banner error">Workflow: {health.workflow_error}</div>}

      <main className="layout">
        <section className="panel">
          {health?.auth_required && !authed ? (
            <AccessGate onOk={() => setAuthed(true)} />
          ) : (
            <NewJobForm health={health} presets={presets} disabled={offline} onCreated={onCreated} />
          )}
        </section>

        <section className="panel stage">
          {selected ? (
            <JobView
              jobId={selected}
              initial={selectedJob}
              canRetry={authed && !offline}
              onChange={refreshJobs}
              onRetried={onCreated}
            />
          ) : (
            <EmptyStage />
          )}
        </section>
      </main>

      <Gallery jobs={jobs} selected={selected} onSelect={setSelected} />

      <footer className="foot">
        React → FastAPI gateway → ComfyUI (private). Built by Juscelio Santos.
      </footer>
    </div>
  );
}

function StatusPills({ health, offline }: { health: Health | null; offline: boolean }) {
  if (offline) return <div className="pills"><span className="pill bad">● offline</span></div>;
  if (!health) return <div className="pills"><span className="pill">connecting…</span></div>;
  return (
    <div className="pills">
      <span className={`pill ${health.comfy_online ? "ok" : "bad"}`}>
        ● {health.mock ? "mock GPU" : health.comfy_online ? "ComfyUI online" : "ComfyUI down"}
      </span>
      <span className="pill">queue {health.queue_size}</span>
      {health.public_mode && <span className="pill">public demo</span>}
    </div>
  );
}

function EmptyStage() {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden>
        <div className="frame a" />
        <div className="arrow">→</div>
        <div className="frame b" />
      </div>
      <h2>Pick a character and a source video</h2>
      <p>
        The result appears here side by side with the original, with synced playback. Each run is
        queued on a single GPU and streamed live.
      </p>
    </div>
  );
}
