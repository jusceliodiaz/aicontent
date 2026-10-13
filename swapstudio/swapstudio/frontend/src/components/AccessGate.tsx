import { FormEvent, useState } from "react";
import { api, setCode } from "../api";

export default function AccessGate({ onOk }: { onOk: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setCode(value.trim());
    try {
      await api.checkCode();
      onOk();
    } catch {
      setCode("");
      setError("That code didn't work.");
    }
  };

  return (
    <form className="gate" onSubmit={submit}>
      <h2>Live demo</h2>
      <p>This demo runs on my own GPU, so access is by invite. Enter the code you received.</p>
      <input
        className="input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Access code"
        autoFocus
      />
      {error && <p className="err">{error}</p>}
      <button className="btn primary" disabled={!value.trim()}>
        Enter
      </button>
    </form>
  );
}
