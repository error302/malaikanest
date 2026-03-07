"use client"

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="card-soft mx-auto max-w-2xl p-8 text-center md:p-10">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-[var(--text-primary)]">
            <CheckCircle2 size={30} />
          </span>

          <h1 className="font-display mt-5 text-[48px] text-[var(--text-primary)]">Order Confirmed</h1>
          <p className="mx-auto mt-3 max-w-xl text-[18px] text-[var(--text-secondary)]">
            Thank you for your purchase. We have received your order and will update you as processing continues.
          </p>

          {orderId && (
            <div className="mx-auto mt-6 max-w-sm rounded-[12px] border border-default bg-[var(--bg-soft)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">Order Number</p>
              <p className="mt-1 text-[28px] font-semibold text-[var(--text-primary)]">#{orderId}</p>
            </div>
          )}

          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            For assistance, contact support@malaikanest7@gmail.com or +254 726 771 321.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/account/orders" className="btn-primary px-7">View My Orders</Link>
            <Link href="/categories" className="btn-secondary px-7">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="pb-20 pt-10"><div className="container-shell text-center text-[var(--text-secondary)]">Loading...</div></div>}>
      <SuccessContent />
    </Suspense>
  )
}
