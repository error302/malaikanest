import { useState } from "react";
import { api } from "./api";
export function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try { await api.login(email.trim(), password); onDone(); }
    catch (err) { setError(err instanceof Error ? err.message : "Sign in failed. Please retry."); }
    finally { setBusy(false); }
  }
  return <main className="login-wrap"><form className="login-card" onSubmit={submit} aria-busy={busy}>
    <h1>Malaika Nest</h1><p className="sub">Sign in to manage your store.</p>
    {error && <p className="error" role="alert">{error}</p>}
    <label className="field"><span>Staff email</span><input type="email" autoComplete="username" autoCapitalize="none" value={email} onChange={e => setEmail(e.target.value)} disabled={busy} required /></label>
    <label className="field" htmlFor="manager-password"><span>Password</span></label>
    <div className="password-row"><input id="manager-password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} required /><button className="btn ghost" type="button" aria-pressed={show} aria-controls="manager-password" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button></div>
    <button className="btn login-submit" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
    <a className="store-link" href="/">Back to shop</a>
  </form></main>;
}
