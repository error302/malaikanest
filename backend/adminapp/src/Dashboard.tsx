import { useEffect, useState } from "react";
import { api, Analytics, ORDER_STATUS_LABELS, OrderStatus } from "./api";

const money = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" });
const date = new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short" });
const paymentMethods: Record<string, string> = {
  mpesa: "M-Pesa", paypal: "PayPal", pesapal: "Pesapal", card: "Card",
};

export function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [period, setPeriod] = useState("30");
  const [hideAmounts, setHideAmounts] = useState(() => {
    try { return localStorage.getItem("manager_hide_overview_amounts") === "true"; }
    catch { return false; }
  });

  function toggleAmounts() {
    const next = !hideAmounts;
    setHideAmounts(next);
    try { localStorage.setItem("manager_hide_overview_amounts", String(next)); }
    catch { /* The setting remains active until this page is closed. */ }
  }

  function displayAmount(value: string) {
    return hideAmounts ? "Amount hidden" : money.format(Number(value));
  }

  useEffect(() => {
    let alive = true;
    api.analytics(period)
      .then(value => { if (alive) setData(value); })
      .catch(error => { if (alive) setError(error.message); });
    return () => { alive = false; };
  }, [attempt, period]);

  return (
    <>
      <div className="dashboard-heading">
        <h2>Store overview</h2>
        <nav aria-label="Common tasks" className="dashboard-actions">
          <a className="btn" href="#products/new">Add a product</a>
          <a className="btn ghost" href="#orders">Manage orders</a>
          <a className="btn ghost" href="#settings">Change homepage photo</a>
        </nav>
      </div>

      <div className="dashboard-work">
        <section className="panel sales-panel" aria-labelledby="sales-title">
          <div className="section-heading">
            <h3 id="sales-title">Payments received</h3>
            <button type="button" className="btn ghost small" onClick={toggleAmounts} aria-pressed={hideAmounts}>
              {hideAmounts ? "Show amounts" : "Hide amounts"}
            </button>
            <label className="sales-period">
              <span>Period</span>
              <select value={period} onChange={(event) => {
                setData(null);
                setError("");
                setPeriod(event.target.value);
              }}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </label>
          </div>
          {error ? (
            <div role="alert" className="error">
              {error} <button className="btn ghost" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Retry</button>
            </div>
          ) : !data ? (
            <p role="status">Loading payments…</p>
          ) : !data.payments ? (
            <p>Payment details are unavailable.</p>
          ) : (
            <>
              <p className="sales-total">{displayAmount(data.payments.received)}</p>
              <p className="sales-note">Gross online payments recorded by the shop, before refunds and fees.</p>
              {data.payments.by_method.length > 0 && (
                <ul className="dashboard-list">
                  {data.payments.by_method.map(row => (
                    <li key={row.method}>
                      <span>{paymentMethods[row.method] || row.method}<small>{row.count} {row.count === 1 ? "payment" : "payments"}</small></span>
                      <strong>{displayAmount(row.amount)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {data?.payments && (
          <section className="panel dispatch-panel" aria-labelledby="orders-to-check">
            <div className="section-heading">
              <h3 id="orders-to-check">Orders to check</h3>
              <a href="#orders">View orders</a>
            </div>
            <ul className="dashboard-list">
              <li><span>Ready to prepare or send</span><strong>{data.payments.to_dispatch}</strong></li>
              <li><span>Awaiting payment</span><strong>{data.payments.awaiting_payment}</strong></li>
            </ul>
          </section>
        )}
      </div>

      {data && (
        <div className="cols dashboard-columns">
          <section className="panel" aria-labelledby="recent-orders-title">
            <div className="section-heading">
              <h3 id="recent-orders-title">Recent orders</h3>
              <a href="#orders">View orders</a>
            </div>
            {data.recent_orders.length ? (
              <ul className="dashboard-list">
                {data.recent_orders.map(order => (
                  <li key={order.id}>
                    <span><strong>{order.order_number}</strong><small>{order.customer_name} · {date.format(new Date(order.created_at))}</small></span>
                    <span>{displayAmount(order.total)}<small>{ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}</small></span>
                  </li>
                ))}
              </ul>
            ) : <p>No orders yet.</p>}
          </section>
          <section className="panel" aria-labelledby="low-stock-title">
            <div className="section-heading">
              <h3 id="low-stock-title">Low stock</h3>
              <a href="#products">View products</a>
            </div>
            {data.low_stock.length ? (
              <ul className="dashboard-list">
                {data.low_stock.map((stock, index) => (
                  <li key={index}><span>{stock.product}</span><strong>{stock.available} left</strong></li>
                ))}
              </ul>
            ) : <p>No low-stock products.</p>}
          </section>
        </div>
      )}
    </>
  );
}
