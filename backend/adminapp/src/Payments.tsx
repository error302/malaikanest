import { useEffect, useState } from "react";
import { api, MpesaPayments, PaymentState } from "./api";

const labels: Record<PaymentState, string> = {
  pending: "Pending", confirmed: "Confirmed", failed: "Failed",
  cancelled: "Cancelled", unreconciled: "Unreconciled",
};
const statuses = { initiated: "Pending", completed: "Confirmed", failed: "Failed", cancelled: "Cancelled" };
const issues: Record<string, string> = {
  receipt_unverified: "Match the receipt against your M-Pesa statement.",
  callback_metadata_mismatch: "Reported details differ. Check your M-Pesa statement.",
  order_closed: "Money received for a closed order. Review before taking action.",
  intent_mismatch: "The confirmed details differ from the original order. Review the statement.",
  duplicate_receipt: "This receipt is already linked to another transaction.",
  initiation_unknown: "Safaricom did not confirm whether the prompt was sent.",
  query_attempts_exhausted: "Safaricom did not return a final result. Check the statement.",
};
const money = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" });
const date = new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" });

export function Payments() {
  const [state, setState] = useState<PaymentState>("unreconciled");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<MpesaPayments>();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
    api.mpesaPayments(state, page, signal).then(setData).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Payments could not load.");
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [state, page, reload]);

  function load(next: PaymentState, number: number) {
    setBusy(true);
    setError("");
    setState(next);
    setPage(number);
    setReload((value) => value + 1);
  }

  return <section className="payments-screen">
    <header className="payments-title">
      <div><h1>M-Pesa payments</h1><p>Track checkout payments and review receipts against your till statement.</p></div>
      <button className="btn ghost" onClick={() => load(state, page)} disabled={busy}>Refresh</button>
    </header>
    <div className="payments-filters" aria-label="Filter payments">
      {(Object.keys(labels) as PaymentState[]).map((key) =>
        <button key={key} aria-pressed={key === state} onClick={() => load(key, 1)}>
          {labels[key]} {data && <span>{data.counts[key]}</span>}
        </button>
      )}
    </div>
    {busy && <p role="status">Loading payments…</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {!busy && !error && data && <>
      {data.transactions.length === 0 && <p>No {labels[state].toLowerCase()} payments found.</p>}
      <ul className="payments-list">
        {data.transactions.map((payment) => <li key={payment.id}>
          <div>
            <strong>{payment.order}</strong>
            <span>{date.format(new Date(payment.initiated_at))}</span>
          </div>
          <div>
            <strong className="payment-amount">{money.format(Number(payment.amount))}</strong>
            <span>{statuses[payment.status]} · Order {payment.order_status.toLowerCase()}</span>
          </div>
          <div>
            {payment.issue && <p>{issues[payment.issue] ?? "Review this payment."}</p>}
            {payment.receipt && <span>Verified receipt {payment.receipt}</span>}
            {!payment.receipt && payment.reported_receipt && <span>Reported receipt {payment.reported_receipt}</span>}
            {payment.checkout_id && <details>
              <summary>Transaction details</summary>
              <span>Checkout ID {payment.checkout_id}</span>
              {payment.destination && <span>Till {payment.destination}</span>}
              {payment.statement_verified_at && <span>Statement matched {date.format(new Date(payment.statement_verified_at))}</span>}
            </details>}
          </div>
        </li>)}
      </ul>
      <nav className="payments-pagination" aria-label="Payment pages">
        <button className="btn ghost" disabled={page <= 1} onClick={() => load(state, page - 1)}>Previous</button>
        <span>Page {page}</span>
        <button className="btn ghost" disabled={!data.has_next} onClick={() => load(state, page + 1)}>Next</button>
      </nav>
    </>}
  </section>;
}
