import { useEffect, useRef, useState } from "react";

interface Props {
  source: string;
  output: string;
  character: string;
}

/** Original and result played in lockstep, side by side or as a wipe. */
export default function CompareView({ source, output, character }: Props) {
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [mode, setMode] = useState<"side" | "wipe">("side");
  const [wipe, setWipe] = useState(50);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const out = b.current!;
    const onTime = () => {
      setT(out.currentTime);
      const src = a.current!;
      if (Math.abs(src.currentTime - out.currentTime) > 0.08) src.currentTime = out.currentTime;
    };
    const onMeta = () => setDur(out.duration || 0);
    const onEnd = () => setPlaying(false);
    out.addEventListener("timeupdate", onTime);
    out.addEventListener("loadedmetadata", onMeta);
    out.addEventListener("ended", onEnd);
    if (out.readyState >= 1) onMeta(); // metadata may already be loaded (cache)
    return () => {
      out.removeEventListener("timeupdate", onTime);
      out.removeEventListener("loadedmetadata", onMeta);
      out.removeEventListener("ended", onEnd);
    };
  }, [output]);

  const toggle = async () => {
    const vids = [a.current!, b.current!];
    if (playing) {
      vids.forEach((v) => v.pause());
      setPlaying(false);
    } else {
      if (b.current!.ended) vids.forEach((v) => (v.currentTime = 0));
      await Promise.all(vids.map((v) => v.play().catch(() => {})));
      setPlaying(true);
    }
  };

  const seek = (v: number) => {
    [a.current!, b.current!].forEach((el) => (el.currentTime = v));
    setT(v);
  };

  return (
    <div className="compare">
      <div className="compare-tools">
        <div className="seg">
          <button className={mode === "side" ? "on" : ""} onClick={() => setMode("side")}>
            Side by side
          </button>
          <button className={mode === "wipe" ? "on" : ""} onClick={() => setMode("wipe")}>
            Wipe
          </button>
        </div>
        <img className="ref-thumb" src={character} alt="Character reference" title="Character reference" />
      </div>

      <div className={`compare-stage ${mode}`}>
        <figure className="pane src">
          <video ref={a} src={source} muted playsInline preload="auto" />
          <figcaption>Original</figcaption>
        </figure>
        <figure
          className="pane out"
          style={mode === "wipe" ? { clipPath: `inset(0 0 0 ${wipe}%)` } : undefined}
        >
          <video ref={b} src={output} muted={muted} playsInline preload="auto" />
          <figcaption>Result</figcaption>
        </figure>
        {mode === "wipe" && (
          <>
            <div className="wipe-line" style={{ left: `${wipe}%` }} />
            <input
              className="wipe-range"
              type="range"
              min={0}
              max={100}
              value={wipe}
              onChange={(e) => setWipe(+e.target.value)}
              aria-label="Wipe position"
            />
          </>
        )}
      </div>

      <div className="transport">
        <button className="btn icon" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <input
          type="range"
          min={0}
          max={dur || 1}
          step={0.01}
          value={t}
          onChange={(e) => seek(+e.target.value)}
          aria-label="Seek"
        />
        <span className="mono time">
          {t.toFixed(1)} / {dur.toFixed(1)}s
        </span>
        <button className="btn icon" onClick={() => setMuted((m) => !m)} aria-label="Toggle sound">
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
    </div>
  );
}
