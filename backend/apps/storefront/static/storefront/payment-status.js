(() => {
  const { pollUrl, initialState } = document.currentScript.dataset;
  const heading = document.getElementById("payment-heading");
  const description = document.getElementById("payment-description");
  const receipt = document.getElementById("payment-receipt");
  const connection = document.getElementById("payment-connection");
  const refresh = document.getElementById("payment-refresh");
  const messages = {
    pending: ["Waiting for M-Pesa", "This page refreshes automatically. If you approved the prompt, wait here for confirmation."],
    confirmed: ["Payment confirmed", "We’ve confirmed your payment and will prepare your order."],
    review: ["We’re checking your payment", "If M-Pesa debited you, keep your receipt and contact the shop before paying again."],
    cancelled: ["M-Pesa prompt cancelled", "Contact the shop if you need help completing payment."],
    failed: ["M-Pesa payment failed", "Contact the shop if you need help completing payment."],
    closed: ["This order is closed", "Contact the shop if M-Pesa debited you for this order."],
  };
  let timer;
  let inFlight = false;
  let attempts = 0;
  let current = initialState;
  const terminal = () => ["confirmed", "cancelled", "failed", "closed"].includes(current);

  function schedule() {
    clearTimeout(timer);
    if (!document.hidden && !terminal() && attempts < 120) {
      timer = setTimeout(check, attempts < 12 ? 5000 : 15000);
    }
  }

  async function check() {
    clearTimeout(timer);
    if (inFlight || document.hidden || terminal()) return;
    if (!navigator.onLine) {
      connection.textContent = "You’re offline. Payment status will refresh when you reconnect.";
      return;
    }
    inFlight = true;
    if (refresh) refresh.disabled = true;
    try {
      const response = await fetch(pollUrl, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Payment status unavailable");
      const result = await response.json();
      if (messages[result.payment_state] && result.payment_state !== current) {
        current = result.payment_state;
        [heading.textContent, description.textContent] = messages[current];
        document.getElementById("tillInstructionsBox")?.classList.add("hidden");
      }
      if (current === "confirmed" && result.mpesa_receipt) {
        receipt.textContent = "M-Pesa receipt " + result.mpesa_receipt;
        receipt.hidden = false;
      }
      connection.textContent = "";
    } catch {
      connection.textContent = "Couldn’t refresh payment status. We’ll try again when the connection is available.";
    } finally {
      attempts += 1;
      inFlight = false;
      if (refresh) {
        refresh.disabled = false;
        refresh.hidden = terminal();
      }
      schedule();
    }
  }

  refresh?.addEventListener("click", () => { attempts = 0; check(); });
  window.addEventListener("online", check);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(timer);
    else if (attempts < 120) check();
  });
  schedule();
})();
