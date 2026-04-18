"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import api, { handleApiError } from "@/lib/api"

interface MpesaCheckoutProps {
  orderId?: string | null
  totalAmount: number
  defaultPhone?: string
  guestEmail?: string
  onSuccess?: (receipt: string, orderId: string) => void
  onFailure?: (message?: string) => void
  onInitiate?: (checkoutRequestId: string, orderId: string) => void
  onPrepareOrder?: () => Promise<string | null>
}

type Stage = "idle" | "sending" | "waiting" | "success" | "failed"

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("0")) return `254${digits.slice(1)}`
  if (digits.startsWith("254")) return digits
  if (digits.length === 9) return `254${digits}`
  return digits
}

function stripPhonePrefix(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("254")) return digits.slice(3, 12)
  if (digits.startsWith("0")) return digits.slice(1, 10)
  return digits.slice(0, 9)
}

function formatKES(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount)
}

function Dots() {
  return (
    <span className="dots-wrap" aria-hidden>
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </span>
  )
}

function StepBubble({
  n,
  label,
  active,
  done,
}: {
  n: number
  label: string
  active: boolean
  done: boolean
}) {
  return (
    <div className={`step ${active ? "step--active" : ""} ${done ? "step--done" : ""}`}>
      <div className="step__circle">
        {done ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span>{n}</span>
        )}
      </div>
      <span className="step__label">{label}</span>
    </div>
  )
}

export default function MpesaCheckout({
  orderId,
  totalAmount,
  defaultPhone = "",
  guestEmail = "",
  onSuccess,
  onFailure,
  onInitiate,
  onPrepareOrder,
}: MpesaCheckoutProps) {
  const [phone, setPhone] = useState(stripPhonePrefix(defaultPhone))
  const [stage, setStage] = useState<Stage>("idle")
  const [error, setError] = useState("")
  const [receipt, setReceipt] = useState("")
  const [elapsed, setElapsed] = useState(0)

  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  const normalizedPhone = useMemo(() => formatPhone(phone), [phone])

  const clearTimers = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const failPayment = useCallback((message: string) => {
    if (!isMountedRef.current) return
    clearTimers()
    setStage("failed")
    setError(message)
    onFailure?.(message)
  }, [clearTimers, onFailure])

  const startPolling = useCallback((checkoutRequestId: string, resolvedOrderId: string) => {
    clearTimers()
    setElapsed(0)
    setStage("waiting")

    tickRef.current = setInterval(() => {
      if (!isMountedRef.current) return
      setElapsed((current) => current + 1)
    }, 1000)

    const poll = async () => {
      try {
        const res = await api.get(`/api/v1/payments/verify/${encodeURIComponent(checkoutRequestId)}/`, {
          params: guestEmail ? { guest_email: guestEmail } : undefined,
        })
        const payment = res.data

        if (payment.status === "completed") {
          clearTimers()
          if (!isMountedRef.current) return

          const receiptNumber = payment.mpesa_receipt_number || ""
          setReceipt(receiptNumber)
          setStage("success")
          onSuccess?.(receiptNumber, resolvedOrderId)
          return
        }

        if (["failed", "cancelled"].includes(payment.status)) {
          failPayment("Payment was not completed. Tafadhali jaribu tena.")
          return
        }
      } catch (err: unknown) {
        failPayment(handleApiError(err, "We could not confirm your payment right now."))
        return
      }

      pollTimeoutRef.current = setTimeout(poll, 3000)
    }

    timeoutRef.current = setTimeout(() => {
      failPayment("Payment verification timed out. If you were charged, your order will confirm shortly.")
    }, 120000)

    pollTimeoutRef.current = setTimeout(poll, 3000)
  }, [clearTimers, failPayment, guestEmail, onSuccess])

  useEffect(() => {
    setPhone(stripPhonePrefix(defaultPhone))
  }, [defaultPhone])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      clearTimers()
    }
  }, [clearTimers])

  const handlePay = async () => {
    setError("")

    if (!/^254[17]\d{8}$/.test(normalizedPhone)) {
      setError("Please enter a valid Safaricom number (07XX or 01XX).")
      return
    }

    setStage("sending")

    try {
      let resolvedOrderId = orderId ? String(orderId) : null

      if (!resolvedOrderId) {
        if (!onPrepareOrder) {
          throw new Error("Order is not ready for payment yet.")
        }
        resolvedOrderId = await onPrepareOrder()
      }

      const response = await api.post("/api/v1/payments/mpesa/initiate/", {
        order_id: resolvedOrderId,
        phone: normalizedPhone,
        guest_email: guestEmail || undefined,
      })

      const checkoutRequestId = response.data?.checkout_request_id
      if (!checkoutRequestId) {
        throw new Error("No checkout request ID received.")
      }

      onInitiate?.(checkoutRequestId, resolvedOrderId)
      startPolling(checkoutRequestId, resolvedOrderId)
    } catch (err: unknown) {
      setStage("idle")
      setError(handleApiError(err, "Something went wrong. Please try again."))
    }
  }

  const stepsState = {
    step1Done: ["waiting", "success"].includes(stage),
    step1Active: stage === "sending",
    step2Done: stage === "success",
    step2Active: stage === "waiting",
    step3Done: stage === "success",
    step3Active: false,
  }

  return (
    <>
      <style>{`
        .mpesa-root {
          font-family: 'DM Sans', sans-serif;
          --green: #00a651;
          --green-light: #e8f7ef;
          --green-mid: #c3ecd5;
          --red: #e63946;
          --red-light: #fdeaea;
          --ink: #1a1a2e;
          --muted: #6b7280;
          --border: #e5e7eb;
          --surface: #ffffff;
          --radius: 16px;
        }
        .mpesa-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: 0 4px 32px rgba(0,0,0,0.08);
        }
        .mpesa-header {
          background: linear-gradient(135deg, #00a651 0%, #007a3d 100%);
          padding: 20px 24px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mpesa-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mpesa-logo__icon {
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--green);
        }
        .mpesa-logo__text {
          font-family: serif;
          font-size: 18px;
          font-weight: 700;
          color: white;
        }
        .mpesa-logo__sub {
          font-size: 10px;
          color: rgba(255,255,255,0.7);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .mpesa-amount-badge {
          text-align: right;
        }
        .mpesa-amount-badge__label {
          font-size: 10px;
          color: rgba(255,255,255,0.65);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .mpesa-amount-badge__value {
          font-family: serif;
          font-size: 22px;
          font-weight: 700;
          color: white;
        }
        .mpesa-body {
          padding: 24px;
        }
        .steps {
          display: flex;
          align-items: flex-start;
          gap: 0;
          margin-bottom: 24px;
          position: relative;
        }
        .steps::before {
          content: '';
          position: absolute;
          top: 14px;
          left: 16px;
          right: 16px;
          height: 2px;
          background: var(--border);
          z-index: 0;
        }
        .step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
          z-index: 1;
        }
        .step__circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid var(--border);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          transition: all 0.3s ease;
        }
        .step--active .step__circle {
          border-color: var(--green);
          color: var(--green);
          background: var(--green-light);
        }
        .step--done .step__circle {
          border-color: var(--green);
          background: var(--green);
          color: white;
        }
        .step__label {
          font-size: 10px;
          color: var(--muted);
          text-align: center;
          font-weight: 500;
        }
        .step--active .step__label,
        .step--done .step__label {
          color: var(--ink);
        }
        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          display: block;
        }
        .phone-wrap {
          display: flex;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.2s;
          background: #fafafa;
        }
        .phone-wrap:focus-within {
          border-color: var(--green);
          background: white;
        }
        .phone-prefix {
          padding: 0 12px;
          background: var(--green-light);
          display: flex;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--green);
          border-right: 1.5px solid var(--green-mid);
        }
        .phone-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 12px 14px;
          font-size: 15px;
          font-weight: 500;
          color: var(--ink);
          outline: none;
        }
        .error-msg {
          color: var(--red);
          font-size: 12px;
          margin-top: 8px;
        }
        .info-box {
          background: var(--green-light);
          border: 1px solid var(--green-mid);
          border-radius: 10px;
          padding: 12px;
          margin: 16px 0;
          font-size: 12px;
          color: #1a5c36;
          line-height: 1.5;
        }
        .waiting-box {
          background: var(--green-light);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin: 16px 0;
        }
        .phone-icon {
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 50%;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0,166,81,0.15);
          animation: pulse 1.8s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .waiting-box__title {
          font-family: serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--ink);
        }
        .waiting-box__sub {
          font-size: 12px;
          color: #3a7d58;
        }
        .success-box {
          text-align: center;
          padding: 16px 0;
        }
        .success-icon {
          width: 56px;
          height: 56px;
          background: var(--green);
          border-radius: 50%;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .success-box__title {
          font-family: serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--ink);
        }
        .success-box__sub {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 12px;
        }
        .receipt-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--green-light);
          border: 1px solid var(--green-mid);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #00733a;
        }
        .failed-box {
          text-align: center;
          padding: 16px 0;
        }
        .failed-icon {
          width: 56px;
          height: 56px;
          background: var(--red-light);
          border: 2px solid var(--red);
          border-radius: 50%;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: var(--red);
        }
        .failed-box__title {
          font-family: serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--ink);
        }
        .failed-box__sub {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 16px;
        }
        .pay-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #00a651 0%, #007a3d 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s;
          box-shadow: 0 4px 16px rgba(0,166,81,0.3);
        }
        .pay-btn:hover:not(:disabled) {
          opacity: 0.92;
        }
        .pay-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .pay-btn--ghost {
          background: transparent;
          color: var(--green);
          box-shadow: none;
          border: 1.5px solid var(--green);
        }
        .dots-wrap {
          display: inline-flex;
          gap: 3px;
        }
        .dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: white;
          animation: bounce 1.2s ease-in-out infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="mpesa-root">
        <div className="mpesa-card">
          <div className="mpesa-header">
            <div className="mpesa-logo">
              <div className="mpesa-logo__icon">M</div>
              <div>
                <div className="mpesa-logo__text">M-PESA</div>
                <div className="mpesa-logo__sub">Secure Payment</div>
              </div>
            </div>
            <div className="mpesa-amount-badge">
              <div className="mpesa-amount-badge__label">Total</div>
              <div className="mpesa-amount-badge__value">{formatKES(totalAmount)}</div>
            </div>
          </div>

          <div className="mpesa-body">
            <div className="steps">
              <StepBubble n={1} label="Send prompt" active={stepsState.step1Active} done={stepsState.step1Done} />
              <StepBubble n={2} label="Enter PIN" active={stepsState.step2Active} done={stepsState.step2Done} />
              <StepBubble n={3} label="Confirmed" active={stepsState.step3Active} done={stepsState.step3Done} />
            </div>

            {(stage === "idle" || stage === "sending") && (
              <>
                <label className="field-label" htmlFor="mpesa-phone">
                  Safaricom Number
                </label>
                <div className="phone-wrap">
                  <div className="phone-prefix">+254</div>
                  <input
                    id="mpesa-phone"
                    className="phone-input"
                    type="tel"
                    inputMode="numeric"
                    placeholder="7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    disabled={stage === "sending"}
                    maxLength={9}
                  />
                </div>

                {error && <p className="error-msg">{error}</p>}

                <div className="info-box">
                  <strong>How it works:</strong> You&apos;ll receive a prompt on your phone to enter your M-PESA PIN and complete payment of <strong>{formatKES(totalAmount)}</strong>.
                </div>

                <button
                  className="pay-btn"
                  onClick={handlePay}
                  disabled={stage === "sending" || phone.length < 9}
                >
                  {stage === "sending" ? (
                    <>Sending <Dots /></>
                  ) : (
                    <>Pay {formatKES(totalAmount)}</>
                  )}
                </button>
              </>
            )}

            {stage === "waiting" && (
              <>
                <div className="waiting-box">
                  <div className="phone-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00a651" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </div>
                  <div className="waiting-box__title">Check your phone</div>
                  <div className="waiting-box__sub">
                    Prompt sent to <strong>+{formatPhone(phone)}</strong><br />
                    Enter PIN to complete payment{elapsed > 0 ? ` • ${elapsed}s` : ""}
                  </div>
                </div>

                <button
                  className="pay-btn pay-btn--ghost"
                  onClick={() => {
                    clearTimers()
                    setStage("idle")
                    setElapsed(0)
                  }}
                >
                  ← Change number
                </button>
              </>
            )}

            {stage === "success" && (
              <div className="success-box">
                <div className="success-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div className="success-box__title">Payment Received!</div>
                <div className="success-box__sub">
                  Your order has been confirmed.
                </div>
                {receipt && (
                  <div className="receipt-pill">
                    Receipt: {receipt}
                  </div>
                )}
              </div>
            )}

            {stage === "failed" && (
              <div className="failed-box">
                <div className="failed-icon">✕</div>
                <div className="failed-box__title">Payment Failed</div>
                <div className="failed-box__sub">
                  {error || "The payment was cancelled or timed out."}
                </div>
                <button
                  className="pay-btn"
                  onClick={() => {
                    clearTimers()
                    setStage("idle")
                    setError("")
                    setElapsed(0)
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
