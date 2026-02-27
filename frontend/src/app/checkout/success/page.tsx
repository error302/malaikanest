"use client"
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-secondary/50">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-semibold text-text mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
          
          {orderId && (
            <div className="bg-secondary/30 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">Order Number</div>
              <div className="text-xl font-bold text-text">#{orderId}</div>
            </div>
          )}
          
          <p className="text-sm text-gray-500 mb-8">
            You will receive an SMS confirmation shortly. For any inquiries, contact us at malaikanest7@gmail.com
          </p>
          
          <div className="flex flex-col gap-3">
            <Link
              href="/account/orders"
              className="block w-full py-3 bg-cta hover:bg-cta-hover text-white font-semibold rounded-lg transition-colors"
            >
              View My Orders
            </Link>
            <Link
              href="/categories"
              className="block w-full py-3 bg-white border border-cta text-cta hover:bg-secondary font-semibold rounded-lg transition-colors"
            >
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
    <Suspense fallback={<div className="min-h-screen bg-secondary/20 pt-24 pb-12 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <SuccessContent />
    </Suspense>
  )
}
