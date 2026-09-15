import { useState } from "react";
import { api, ApiError } from "./api";

export function Login({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.login(username, password);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>Malaika Nest</h1>
        <p className="sub">Store manager sign-in</p>
        {error && <div className="error">{error}</div>}
        <label className="field">
          <span>Email</span>
          <input
            type="text"
            value={username}
            autoFocus
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="btn" disabled={busy} type="submit" style={{ width: "100%" }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
