import { useEffect, useState } from "react";
import { api, Job } from "../api";
import CompareView from "./CompareView";

interface Props {
  jobId: string;
  initial: Job | null;
  canRetry: boolean;
  onChange: () => void;
  onRetried: (job: Job) => void;
}

export default function JobView({ jobId, initial, canRetry, onChange, onRetried }: Props) {
  const [job, setJob] = useState<Job | null>(initial);
  const [retrying, setRetrying] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    setJob(initial?.id === jobId ? initial : null);
    let finished = false;
    const es = api.events(jobId);
    es.onmessage = (e) => {
      const j: Job = JSON.parse(e.data);
      setJob(j);
      if (j.status === "done" || j.status === "error") {
        finished = true;
        es.close();
        onChange();
      }
    };
    es.onerror = () => {
      // Fallback: one fetch so finished jobs still render if SSE is blocked by a proxy
      if (!finished) api.job(jobId).then(setJob).catch(() => {});
    };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  if (!job) return <div className="empty"><p>Loading…</p></div>;

  const elapsed =
    job.started_at && (job.finished_at ?? Date.now() / 1000) - job.started_at;

  const retry = async () => {
    setRetrying(true);
    try {
      onRetried(await api.retry(job.id));
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="job">
      <div className="job-head">
        <div>
          <h2>Job {job.id.slice(0, 8)}</h2>
          <p className="meta mono">
            seed {job.seed} · {job.duration.toFixed(1)}s
            {elapsed ? ` · ${formatSecs(elapsed)}` : ""}
          </p>
        </div>
        <span className={`status ${job.status}`}>{job.status}</span>
      </div>

      {(job.status === "queued" || job.status === "running") && (
        <div className="progress-card">
          <div className="progress">
            <div className="bar" style={{ width: `${Math.round(job.progress * 100)}%` }} />
          </div>
          <div className="progress-meta">
            <span>
              {job.status === "queued" && job.queue_position
                ? `${job.queue_position} job(s) ahead`
                : job.message}
            </span>
            <span className="mono">{Math.round(job.progress * 100)}%</span>
          </div>
          <div className="inputs-preview">
            <img src={api.fileUrl(job.id, "character")} alt="Character reference" />
            <video src={api.fileUrl(job.id, "source")} muted loop autoPlay playsInline />
          </div>
        </div>
      )}

      {job.status === "error" && (
        <div className="banner error">
          <strong>Failed:</strong> {job.error}
        </div>
      )}

      {job.status === "done" && (
        <CompareView
          source={api.fileUrl(job.id, "source")}
          output={api.fileUrl(job.id, "output")}
          character={api.fileUrl(job.id, "character")}
        />
      )}

      <div className="job-actions">
        {job.status === "done" && (
          <a className="btn" href={api.fileUrl(job.id, "output")} download={`swap_${job.id.slice(0, 8)}.mp4`}>
            Download MP4
          </a>
        )}
        {canRetry && (job.status === "done" || job.status === "error") && (
          <button className="btn" onClick={retry} disabled={retrying}>
            {retrying ? "Queuing…" : "Run again, new seed"}
          </button>
        )}
        <button className="btn ghost" onClick={() => setShowPrompt((s) => !s)}>
          {showPrompt ? "Hide prompt" : "Show prompt"}
        </button>
      </div>
      {showPrompt && <pre className="prompt-box">{job.prompt}</pre>}
    </div>
  );
}

function formatSecs(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m ? `${m}m ${r}s` : `${r}s`;
}
