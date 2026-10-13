import { DragEvent, useEffect, useRef, useState } from "react";
import { api, Preset } from "../api";

export type AssetChoice = { kind: "file"; file: File } | { kind: "preset"; preset: Preset } | null;

interface Props {
  label: string;
  type: "image" | "video";
  presets: Preset[];
  allowUpload: boolean;
  value: AssetChoice;
  onChange: (v: AssetChoice) => void;
  hint?: string;
}

const ACCEPT = { image: "image/png,image/jpeg,image/webp", video: "video/mp4,video/quicktime,video/webm" };

export default function AssetPicker({ label, type, presets, allowUpload, value, onChange, hint }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (value?.kind === "file") {
      const url = URL.createObjectURL(value.file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(value?.kind === "preset" ? api.presetUrl(value.preset) : null);
  }, [value]);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith(type)) onChange({ kind: "file", file: f });
  };

  return (
    <div className="field">
      <div className="field-head">
        <span className="label">{label}</span>
        {hint && <span className="hint">{hint}</span>}
      </div>

      {allowUpload && (
        <div
          className={`drop ${over ? "over" : ""} ${preview ? "has" : ""}`}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
        >
          {preview ? (
            type === "image" ? (
              <img src={preview} alt="" />
            ) : (
              <video src={preview} muted loop autoPlay playsInline />
            )
          ) : (
            <div className="drop-empty">
              <strong>Drop {type === "image" ? "an image" : "a video"}</strong>
              <span>or click to browse</span>
            </div>
          )}
          {value && (
            <button
              type="button"
              className="clear"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              aria-label="Remove"
            >
              ×
            </button>
          )}
          <input
            ref={input}
            type="file"
            hidden
            accept={ACCEPT[type]}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onChange({ kind: "file", file: f });
              e.target.value = "";
            }}
          />
        </div>
      )}

      {presets.length > 0 && (
        <div className="presets">
          {presets.map((p) => {
            const active = value?.kind === "preset" && value.preset.id === p.id;
            return (
              <button
                type="button"
                key={p.id}
                className={`preset ${active ? "active" : ""}`}
                onClick={() => onChange(active ? null : { kind: "preset", preset: p })}
                title={p.description || p.name}
              >
                {type === "image" ? (
                  <img src={api.presetUrl(p)} alt="" loading="lazy" />
                ) : (
                  <video src={api.presetUrl(p)} muted preload="metadata" />
                )}
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {!allowUpload && presets.length === 0 && <p className="hint">No presets configured on the server.</p>}
    </div>
  );
}
