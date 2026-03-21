"use client"

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Package, ShoppingBag } from 'lucide-react'
import api from '@/lib/api'

/* ── Confetti Effect ─────────────────────────────────────────── */
function ConfettiPiece({ style }: { style: React.CSSProperties }) {
  return <div className="confetti-piece absolute" style={style} />
}

function Confetti() {
  const pieces = Array.from({ length: 30 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 1.5}s`,
    backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'][i % 6],
    width: `${6 + Math.random() * 8}px`,
    height: `${6 + Math.random() * 8}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    animationDuration: `${2 + Math.random() * 2}s`,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(320px) rotate(720deg); opacity: 0; }
        }
        .confetti-piece { animation: confettiFall ease-in forwards; }
      `}</style>
      {pieces.map((style, i) => (
        <ConfettiPiece key={i} style={style} />
      ))}
    </div>
  )
}

/* ── Success Content ─────────────────────────────────────────── */
function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [order, setOrder] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    if (orderId) {
      api.get(`/api/v1/orders/orders/${orderId}/`)
        .then(res => setOrder(res.data))
        .catch(() => {})
    }
    // Hide confetti after 3 seconds
    const t = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(t)
  }, [orderId])

  const estimatedDelivery = (() => {
    const region = order?.delivery_region || 'nairobi'
    const days = region === 'mombasa' ? 0 : region === 'nairobi' ? 2 : 4
    if (days === 0) return 'Today (Same Day Delivery)'
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })
  })()

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="relative card-soft mx-auto max-w-2xl overflow-hidden p-8 text-center md:p-12">
          {showConfetti && <Confetti />}

          {/* Success icon */}
          <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 ring-4 ring-green-200">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>

          <h1 className="font-display relative z-10 mt-6 text-[42px] text-[var(--text-primary)] md:text-[52px]">
            Order Confirmed! 🎉
          </h1>
          <p className="relative z-10 mx-auto mt-3 max-w-md text-[18px] text-[var(--text-secondary)]">
            Thank you for shopping with Malaika Nest. Your little one is going to love it!
          </p>

          {/* Order details box */}
          <div className="relative z-10 mx-auto mt-8 max-w-sm space-y-3 rounded-[16px] border border-default bg-[var(--bg-soft)] p-5 text-left">
            {orderId && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Order Number</span>
                <span className="font-semibold text-[var(--text-primary)]">#{orderId}</span>
              </div>
            )}
            {order?.mpesa_receipt_number && (
              <div className="flex items-center justify-between border-t border-default pt-3">
                <span className="text-sm text-[var(--text-secondary)]">M-Pesa Receipt</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">
                  {order.mpesa_receipt_number}
                </span>
              </div>
            )}
            <div className="flex items-start justify-between border-t border-default pt-3">
              <span className="text-sm text-[var(--text-secondary)]">Est. Delivery</span>
              <span className="text-right text-sm font-semibold text-[var(--text-primary)]">
                {estimatedDelivery}
              </span>
            </div>
            {order?.total && (
              <div className="flex items-center justify-between border-t border-default pt-3">
                <span className="text-sm text-[var(--text-secondary)]">Total Paid</span>
                <span className="font-semibold text-green-600">
                  KES {Number(order.total).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* What's next */}
          <div className="relative z-10 mt-6 rounded-[12px] border border-default bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <p className="font-medium">What happens next?</p>
            <p className="mt-1 text-blue-600">
              You will receive an email confirmation. We will notify you when your order is shipped with a tracking number.
            </p>
          </div>

          <p className="relative z-10 mt-5 text-sm text-[var(--text-secondary)]">
            Questions? Contact us at{' '}
            <a href="mailto:malaikanest7@gmail.com" className="underline">malaikanest7@gmail.com</a>
            {' '}or{' '}
            <a
              href="https://wa.me/254726771321?text=Hi%2C%20I%20have%20a%20question%20about%20my%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              WhatsApp us
            </a>.
          </p>

          <div className="relative z-10 mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={orderId ? `/account/orders` : '/account/orders'}
              className="btn-primary inline-flex items-center justify-center gap-2 px-7"
            >
              <Package size={18} />
              View My Orders
            </Link>
            <Link
              href="/categories"
              className="btn-secondary inline-flex items-center justify-center gap-2 px-7"
            >
              <ShoppingBag size={18} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="pb-20 pt-10">
          <div className="container-shell">
            <div className="card-soft mx-auto max-w-2xl animate-pulse p-10 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-[var(--bg-soft)]" />
              <div className="mx-auto mt-6 h-10 w-64 rounded bg-[var(--bg-soft)]" />
              <div className="mx-auto mt-3 h-5 w-80 rounded bg-[var(--bg-soft)]" />
            </div>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
