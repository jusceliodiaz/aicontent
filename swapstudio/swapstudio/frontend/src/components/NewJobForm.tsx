import { FormEvent, useEffect, useState } from "react";
import { api, Health, Job, PromptFields, Presets } from "../api";
import AssetPicker, { AssetChoice } from "./AssetPicker";

interface Props {
  health: Health | null;
  presets: Presets;
  disabled: boolean;
  onCreated: (job: Job) => void;
}

const DEFAULT_FIELDS: PromptFields = {
  target: "the woman dancing in the center",
  character: "",
  footwear: "as in the reference",
  keep_text: true,
  extra: "",
};

const FOOTWEAR = ["as in the reference", "barefoot", "white sneakers", "black boots", "sandals"];

export default function NewJobForm({ health, presets, disabled, onCreated }: Props) {
  const [character, setCharacter] = useState<AssetChoice>(null);
  const [video, setVideo] = useState<AssetChoice>(null);
  const [fields, setFields] = useState<PromptFields>(DEFAULT_FIELDS);
  const [preview, setPreview] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [seed, setSeed] = useState("");
  const [override, setOverride] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const allowUpload = health?.uploads_allowed ?? true;
  const publicMode = health?.public_mode ?? false;

  // Fill target/description from presets when the user hasn't typed their own
  useEffect(() => {
    if (video?.kind === "preset" && video.preset.target) setFields((f) => ({ ...f, target: video.preset.target! }));
  }, [video]);
  useEffect(() => {
    if (character?.kind === "preset" && character.preset.description)
      setFields((f) => ({ ...f, character: character.preset.description! }));
  }, [character]);

  useEffect(() => {
    const t = setTimeout(() => {
      api.preview(fields).then((r) => setPreview(r.prompt)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [fields]);

  const set = <K extends keyof PromptFields>(k: K, v: PromptFields[K]) => setFields((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!character || !video) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("fields", JSON.stringify(fields));
    if (character.kind === "file") form.set("character", character.file);
    else form.set("character_preset", character.preset.id);
    if (video.kind === "file") form.set("video", video.file);
    else form.set("video_preset", video.preset.id);
    if (seed.trim()) form.set("seed", seed.trim());
    if (override.trim() && !publicMode) form.set("prompt_override", override.trim());
    try {
      onCreated(await api.create(form));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const maxS = health?.max_video_seconds ?? 6;

  return (
    <form className="form" onSubmit={submit}>
      <h2>New swap</h2>

      <div className="pair">
        <AssetPicker
          label="Character"
          type="image"
          presets={presets.characters}
          allowUpload={allowUpload}
          value={character}
          onChange={setCharacter}
          hint="sheet or single view"
        />
        <AssetPicker
          label="Source video"
          type="video"
          presets={presets.videos}
          allowUpload={allowUpload}
          value={video}
          onChange={setVideo}
          hint={`trimmed to ${maxS}s`}
        />
      </div>

      <label className="field">
        <span className="label">Who to replace</span>
        <input className="input" value={fields.target} onChange={(e) => set("target", e.target.value)} />
      </label>

      <label className="field">
        <span className="label">Character details to keep</span>
        <input
          className="input"
          value={fields.character}
          placeholder="e.g. red pin-up updo, white one-shoulder dress, bead necklace"
          onChange={(e) => set("character", e.target.value)}
        />
      </label>

      <div className="row">
        <label className="field grow">
          <span className="label">Footwear</span>
          <select className="input" value={fields.footwear} onChange={(e) => set("footwear", e.target.value)}>
            {FOOTWEAR.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={fields.keep_text} onChange={(e) => set("keep_text", e.target.checked)} />
          <span>Keep on-screen text</span>
        </label>
      </div>

      <label className="field">
        <span className="label">Extra direction</span>
        <input
          className="input"
          value={fields.extra}
          placeholder="optional"
          onChange={(e) => set("extra", e.target.value)}
        />
      </label>

      <details className="prompt-preview" open={advanced} onToggle={(e) => setAdvanced(e.currentTarget.open)}>
        <summary>Prompt & seed</summary>
        <pre>{override.trim() || preview || "…"}</pre>
        <div className="row">
          <label className="field grow">
            <span className="label">Seed</span>
            <input
              className="input mono"
              inputMode="numeric"
              placeholder="random"
              value={seed}
              onChange={(e) => setSeed(e.target.value.replace(/\D/g, ""))}
            />
          </label>
        </div>
        {!publicMode && (
          <label className="field">
            <span className="label">Raw prompt override</span>
            <textarea
              className="input mono"
              rows={4}
              value={override}
              placeholder="Leave empty to use the generated prompt"
              onChange={(e) => setOverride(e.target.value)}
            />
          </label>
        )}
      </details>

      {error && <p className="err">{error}</p>}

      <button className="btn primary big" disabled={!character || !video || busy || disabled}>
        {busy ? "Uploading…" : "Generate"}
      </button>
    </form>
  );
}
