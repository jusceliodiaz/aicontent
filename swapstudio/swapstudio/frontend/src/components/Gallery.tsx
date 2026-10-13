import { api, Job } from "../api";

interface Props {
  jobs: Job[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function Gallery({ jobs, selected, onSelect }: Props) {
  if (!jobs.length) return null;
  return (
    <section className="gallery">
      <h3>History</h3>
      <div className="grid">
        {jobs.map((j) => (
          <button
            key={j.id}
            className={`card ${selected === j.id ? "active" : ""}`}
            onClick={() => onSelect(j.id)}
          >
            <div className="thumb">
              {j.status === "done" ? (
                <video
                  src={api.fileUrl(j.id, "output") + "#t=0.5"}
                  muted
                  preload="metadata"
                  onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                  onMouseLeave={(e) => e.currentTarget.pause()}
                />
              ) : (
                <img src={api.fileUrl(j.id, "character")} alt="" loading="lazy" />
              )}
              <span className={`status ${j.status}`}>{j.status}</span>
            </div>
            <div className="card-meta mono">
              <span>{j.id.slice(0, 8)}</span>
              <span>seed {j.seed}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
