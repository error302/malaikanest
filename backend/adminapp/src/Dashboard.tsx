import { useEffect, useState } from "react";
import { api, Analytics } from "./api";

const kes = (n: number) =>
  "KES " + n.toLocaleString("en-KE", { maximumFractionDigits: 0 });

export function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.analytics().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="loading">Loading dashboard…</div>;

  return (
    <>
      <h2>Dashboard</h2>
      <p className="sub">Live numbers from your store</p>

      <div className="kpis">
        <div className="kpi accent">
          <div className="label">Revenue (paid)</div>
          <div className="value">{kes(data.total_revenue)}</div>
        </div>
        <div className="kpi">
          <div className="label">Total orders</div>
          <div className="value">{data.total_orders}</div>
        </div>
        <div className="kpi">
          <div className="label">Pending orders</div>
          <div className="value">{data.pending_orders}</div>
        </div>
        <div className="kpi">
          <div className="label">Products</div>
          <div className="value">{data.total_products}</div>
        </div>
        <div className="kpi">
          <div className="label">Customers</div>
          <div className="value">{data.total_users}</div>
        </div>
      </div>

      <div className="cols">
        <div className="panel">
          <h3>Recent orders</h3>
          {data.recent_orders.length === 0 ? (
            <p className="sub">No orders yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.order_number}</strong>
                      <br />
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>
                        {new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                      </span>
                    </td>
                    <td>{o.customer_name}</td>
                    <td className="num">{kes(Number(o.total))}</td>
                    <td>
                      <span className={`badge ${o.status}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <h3>Low stock</h3>
          {data.low_stock.length === 0 ? (
            <p className="sub">Nothing running low.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Available</th>
                </tr>
              </thead>
              <tbody>
                {data.low_stock.map((s) => (
                  <tr key={s.product}>
                    <td>{s.product}</td>
                    <td className={`num ${s.available <= 2 ? "stock-low" : ""}`}>{s.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
