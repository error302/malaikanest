import { Component, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, Analytics, Category, Product } from "./api";
import { Login } from "./Login";
import { Dashboard } from "./Dashboard";
import { Products } from "./Products";
import { Payments } from "./Payments";
import { Orders } from "./Orders";
import { Categories } from "./Categories";
import { StorefrontSettings } from "./StorefrontSettings";

const views = { dashboard: "Overview", orders: "Orders", payments: "Payments", products: "Products", categories: "Categories", settings: "Shop settings", "products/new": "Add a product" };
type View = keyof typeof views;
function currentView(): View {
  const hash = location.hash.slice(1);
  return Object.prototype.hasOwnProperty.call(views, hash) ? hash as View : "dashboard";
}
class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="error" role="alert">This page could not be displayed. <button className="btn ghost" onClick={() => location.reload()}>Reload manager</button></div> : this.props.children;
  }
}
export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [view, setView] = useState<View>(currentView);
  const [menu, setMenu] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [signingOut, setSigningOut] = useState(false);
  const main = useRef<HTMLElement>(null);
  const current = useRef(view);
  const checkSession = useCallback(() => {
    setSessionError("");
    api.session().then(() => setAuthed(true)).catch((error) => {
      if (error instanceof ApiError && [401, 403].includes(error.status)) setAuthed(false);
      else setSessionError(error.message || "Cannot connect to the store. Please retry.");
    });
  }, []);
  useEffect(checkSession, [checkSession]);
  useEffect(() => {
    const network = () => setOffline(!navigator.onLine);
    const navigate = () => {
      if (location.hash && !Object.prototype.hasOwnProperty.call(views, location.hash.slice(1))) return;
      if (!window.dispatchEvent(new Event("manager:before-navigate", { cancelable: true }))) {
        history.replaceState(null, "", `#${current.current}`); return;
      }
      current.current = currentView(); setView(current.current); setMenu(false); main.current?.focus();
    };
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    window.addEventListener("hashchange", navigate);
    return () => { window.removeEventListener("online", network); window.removeEventListener("offline", network); window.removeEventListener("hashchange", navigate); };
  }, []);
  useEffect(() => { document.title = `${views[view]} - Malaika Nest`; }, [view]);
  async function logout() {
    if (signingOut || !window.dispatchEvent(new Event("manager:before-navigate", { cancelable: true }))) return;
    setSigningOut(true);
    try { await api.logout(); setAuthed(false); setMenu(false); }
    catch (error) { setSessionError(error instanceof Error ? error.message : "Sign out failed. Please retry."); }
    finally { setSigningOut(false); }
  }
  if (authed === null) return <main className="login-wrap">{sessionError ? <div className="error" role="alert">{sessionError} <button className="btn" onClick={checkSession}>Retry connection</button></div> : <p role="status">Connecting to your store…</p>}</main>;
  if (!authed) return <Login onDone={() => { setAuthed(true); setSessionError(""); }} />;
  return <>
    <a className="skip-link" href="#manager-content">Skip to content</a>
    <div className="shell">
      <aside className="side">
        <div className="brand">Malaika Nest<small>Store manager</small></div>
        <button className="menu-toggle" aria-expanded={menu} aria-controls="manager-navigation" onClick={() => setMenu(!menu)}>{menu ? "Close menu" : "Menu"}</button>
        <nav id="manager-navigation" aria-label="Store management" className={menu ? "manager-navigation open" : "manager-navigation"}>
          {Object.entries(views).filter(([key]) => key !== "products/new").map(([key, label]) => <a key={key} href={`#${key}`} aria-current={view === key || (key === "products" && view === "products/new") ? "page" : undefined} onClick={() => setMenu(false)}>{label}</a>)}
          <a href="/" target="_blank" rel="noopener noreferrer">View shop →</a>
          <button className="logout" disabled={signingOut} onClick={logout}>{signingOut ? "Signing out…" : "Sign out"}</button>
        </nav>
      </aside>
      <main ref={main} id="manager-content" className="main" tabIndex={-1}>
        {offline && <p className="error" role="status">You are offline. Reconnect before saving. Unsaved fields stay on this page.</p>}
        {sessionError && <div className="error" role="alert">{sessionError}</div>}
        <PageBoundary key={view}>
          {view === "dashboard" && <Dashboard />}
          {view === "orders" && <Orders />}
          {view === "payments" && <Payments />}
          {(view === "products" || view === "products/new") && <Products startNew={view === "products/new"} />}
          {view === "categories" && <Categories />}
          {view === "settings" && <StorefrontSettings />}
        </PageBoundary>
      </main>
    </div>
  </>;
}
export type { Analytics, Category, Product };
export { api, ApiError };
