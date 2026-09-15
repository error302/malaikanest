import { useCallback, useEffect, useState } from "react";
import { api, ApiError, Analytics, Category, Product } from "./api";
import { Login } from "./Login";
import { Dashboard } from "./Dashboard";
import { Products } from "./Products";
import { Orders } from "./Orders";

type View = "dashboard" | "orders" | "products";

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [view, setView] = useState<View>("dashboard");

  useEffect(() => {
    api
      .session()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setAuthed(false);
      setView("dashboard");
    }
  }, []);

  if (authed === null) return <div className="loading">Loading…</div>;
  if (!authed)
    return (
      <Login
        onDone={() => setAuthed(true)}
      />
    );

  return (
    <div className="shell">
      <nav className="side">
        <div className="brand">
          Malaika Nest
          <small>Store manager</small>
        </div>
        <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>
          Dashboard
        </button>
        <button className={view === "orders" ? "active" : ""} onClick={() => setView("orders")}>
          Orders
        </button>
        <button className={view === "products" ? "active" : ""} onClick={() => setView("products")}>
          Products
        </button>
        <div className="spacer" />
        <button className="logout" onClick={logout}>
          Sign out
        </button>
      </nav>
      <main className="main">
        {view === "dashboard" ? <Dashboard /> : view === "orders" ? <Orders /> : <Products />}
      </main>
    </div>
  );
}

export type { Analytics, Category, Product };
export { api, ApiError };
