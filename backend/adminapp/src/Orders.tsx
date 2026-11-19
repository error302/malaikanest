import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  Order,
  OrderStatus,
  Paged,
} from "./api";

const PAGE_SIZE = 25;

const kes = (n: number) =>
  "KES " + n.toLocaleString("en-KE", { maximumFractionDigits: 0 });

/** Statuses surfaced as filter chips (full set lives in the state machine). */
const FILTER_STATUSES: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "payment_failed",
];

function paymentBadge(order: Order): { label: string; cls: string } {
  if (order.payment_status === "completed" || order.status === "paid") {
    return { label: "Paid", cls: "on" };
  }
  if (order.payment_status === "failed") {
    return { label: "Payment failed", cls: "cancelled" };
  }
  return { label: "Unpaid", cls: "pending" };
}

export function Orders() {
  const requestVersion = useRef(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Paged<Order> | null>(null);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
    if (status !== "all") params.set("status", status);
    const version = ++requestVersion.current;
    setLoading(true);
    setData(null);
    setError("");
    api
      .orders("?" + params.toString())
      .then(result => { if (version === requestVersion.current) setData(result); })
      .catch((e) => { if (version === requestVersion.current) setError(e.message); })
      .finally(() => { if (version === requestVersion.current) setLoading(false); });
  }, [status, page]);

  useEffect(() => {
    const requests = requestVersion;
    load();
    return () => { requests.current++; };
  }, [load]);

  async function transition(order: Order, next: OrderStatus) {
    if (busyId) return;
    if (["cancelled", "refunded", "paid"].includes(next) && !window.confirm(`Change order ${order.order_number} to ${ORDER_STATUS_LABELS[next]}? This changes the order record; it does not send or refund a payment.`)) return;
    setBusyId(order.id);
    setError("");
    try {
      await api.updateOrderStatus(order.id, next);
      setExpanded(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    } finally {
      setBusyId(null);
    }
  }

  const pages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <>
      <h2>Orders</h2>
      <p className="sub">{data ? `${data.count} orders` : "Loading…"}</p>

      {error && <div className="error" role="alert">{error} <button className="btn ghost" onClick={load}>Retry</button></div>}

      {loading && <p role="status">Loading orders…</p>}
      <div className="toolbar" role="group" aria-label="Filter by status">
        {FILTER_STATUSES.map((s) => (
          <button
            key={s}
            className="chip"
            aria-pressed={status === s}
            onClick={() => {
              setStatus(s);
              setPage(0);
            }}
          >
            {s === "all" ? "All" : ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="panel table-scroll" role="region" aria-label="Orders table, scroll horizontally for more columns" tabIndex={0} style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Payment</th>
              <th className="num">Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.results.map((o) => {
              const pay = paymentBadge(o);
              const nexts = ORDER_STATUS_TRANSITIONS[o.status] ?? [];
              const open = expanded === o.id;
              return (
                <OrderRow
                  key={o.id}
                  order={o}
                  pay={pay}
                  open={open}
                  busy={busyId !== null}
                  nexts={nexts}
                  onToggle={() => setExpanded(open ? null : o.id)}
                  onTransition={(s) => transition(o, s)}
                />
              );
            })}
            {data?.results.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--muted)" }}>
                  No orders with this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="pager">
          <button className="btn ghost small" disabled={page === 0} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>
          <span>
            Page {page + 1} of {pages}
          </span>
          <button
            className="btn ghost small"
            disabled={page + 1 >= pages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}

function OrderRow({
  order,
  pay,
  open,
  busy,
  nexts,
  onToggle,
  onTransition,
}: {
  order: Order;
  pay: { label: string; cls: string };
  open: boolean;
  busy: boolean;
  nexts: OrderStatus[];
  onToggle: () => void;
  onTransition: (s: OrderStatus) => void;
}) {
  const phone = order.shipping_phone || order.guest_phone || "—";
  return (
    <>
      <tr>
        <td>
          <button className="rowlink" onClick={onToggle} aria-expanded={open}>
            <strong>{order.order_number}</strong>
          </button>
          <br />
          <span style={{ color: "var(--muted)", fontSize: 12 }}>
            {new Date(order.created_at).toLocaleDateString("en-KE", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </td>
        <td>
          {order.customer_name}
          <br />
          <span style={{ color: "var(--muted)", fontSize: 12 }}>{phone}</span>
        </td>
        <td>
          <span className={`badge ${pay.cls}`}>{pay.label}</span>
          {order.mpesa_receipt_number && (
            <>
              <br />
              <span style={{ color: "var(--muted)", fontSize: 11.5 }} title="M-Pesa receipt">
                {order.mpesa_receipt_number}
              </span>
            </>
          )}
        </td>
        <td className="num">{kes(Number(order.total))}</td>
        <td>
          <span className={`badge ${order.status}`}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</span>
        </td>
        <td>
          {nexts.length > 0 && (
            <button className="btn ghost small" onClick={onToggle} aria-expanded={open}>
              {open ? "Close" : "Update"}
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} style={{ background: "var(--blue-wash)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <strong style={{ fontSize: 13 }}>Items</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13 }}>
                  {(order.items ?? []).map((it) => (
                    <li key={it.id}>
                      {it.quantity} × {it.product?.name ?? "Item"} — {kes(Number(it.price))}
                    </li>
                  ))}
                </ul>
              </div>
              {order.delivery_region && (
                <div style={{ fontSize: 13 }}>
                  <strong>Deliver to:</strong> {order.delivery_region}
                </div>
              )}
              {nexts.length > 0 && (
                <div>
                  <strong style={{ fontSize: 13, display: "block", marginBottom: 6 }}>Move status to</strong>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {nexts.map((s) => (
                      <button
                        key={s}
                        className={`btn small ${s === "cancelled" || s === "refunded" ? "ghost danger" : ""}`}
                        disabled={busy}
                        onClick={() => onTransition(s)}
                      >
                        {ORDER_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {nexts.length === 0 && (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  This order is final — no further status changes.
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
