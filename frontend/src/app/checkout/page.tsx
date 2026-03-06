"use client"

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import api, { handleApiError } from '@/lib/api'

type CartData = {
  id: number
  items: Array<{
    id: number
    product: { id: number; name: string; price: string; image: string }
    quantity: number
  }>
  subtotal: string
  total: string
}

const toMoneyNumber = (value: string | number): number => {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : 0
}

const formatKsh = (value: string | number): string =>
  new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toMoneyNumber(value))

function CheckoutContent() {
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [phone, setPhone] = useState('')
  const [deliveryRegion, setDeliveryRegion] = useState('nairobi')
  const [isGift, setIsGift] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState<number | null>(null)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/api/orders/cart/')
      setCart(res.data)
    } catch (err: unknown) {
      const msg = handleApiError(err)
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('invalid refresh token')) {
        router.push('/login?redirect=/checkout')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  useEffect(() => {
    const pendingOrder = searchParams.get('order_id')
    if (pendingOrder) {
      setOrderId(parseInt(pendingOrder, 10))
      setPaymentInitiated(true)
    }
  }, [searchParams])

  const handleCheckout = async () => {
    setError('')
    setProcessing(true)

    try {
      const checkoutRes = await api.post('/api/orders/cart/checkout/', {
        delivery_region: deliveryRegion,
        is_gift: isGift,
        gift_message: giftMessage,
      })

      const order = checkoutRes.data
      setOrderId(order.id)

      await api.post('/api/payments/mpesa/pay/', {
        order_id: order.id,
        phone: phone.replace(/\D/g, ''),
      })

      setPaymentInitiated(true)
      pollPaymentStatus(order.id)
    } catch (err: unknown) {
      setError(handleApiError(err))
      setProcessing(false)
    }
  }

  const pollPaymentStatus = async (oid: number) => {
    let attempts = 0
    const maxAttempts = 30
    let consecutiveErrors = 0

    const poll = async () => {
      attempts++
      try {
        const res = await api.get(`/api/orders/orders/${oid}/`)
        const order = res.data
        consecutiveErrors = 0

        if (order.status === 'paid') {
          router.push(`/checkout/success?order_id=${oid}`)
          return
        }

        if (['payment_failed', 'cancelled', 'failed'].includes(order.status)) {
          setError('Payment was not completed. Please try again.')
          setProcessing(false)
          return
        }
      } catch (err: unknown) {
        const msg = handleApiError(err)
        if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('invalid refresh token')) {
          router.push('/login?redirect=/checkout')
          return
        }

        consecutiveErrors++
        if (consecutiveErrors >= 3) {
          setError('Network error while checking payment status. Please check your order history or contact support.')
          setProcessing(false)
          return
        }
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 5000)
      } else {
        setError('Payment verification timed out. Check your M-Pesa messages — if charged, your order will be confirmed shortly.')
        setProcessing(false)
      }
    }

    setTimeout(poll, 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--border)] rounded w-1/3"></div>
            <div className="bg-[var(--bg-card)] p-6 rounded-xl h-64"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!cart || (cart.items.length === 0 && !paymentInitiated)) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center py-16">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Your cart is empty</h1>
          <a href="/categories" className="text-[var(--accent)] hover:underline">Continue shopping</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Checkout</h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!paymentInitiated ? (
          <>
            <div className="bg-[var(--bg-card)] rounded-xl p-6 mb-6 shadow-sm border border-[var(--border)]">
              <h2 className="font-semibold text-lg mb-4 text-[var(--text-primary)]">Order Summary</h2>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-[var(--text-secondary)]">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>Ksh {formatKsh(toMoneyNumber(item.product.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border)] mt-4 pt-4 flex justify-between font-semibold text-[var(--text-primary)]">
                <span>Total</span>
                <span>Ksh {formatKsh(cart.total)}</span>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-xl p-6 mb-6 shadow-sm border border-[var(--border)]">
              <h2 className="font-semibold text-lg mb-4 text-[var(--text-primary)]">Delivery Details</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Delivery Region</label>
                <select
                  value={deliveryRegion}
                  onChange={(e) => setDeliveryRegion(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-[var(--bg-card)] text-[var(--text-primary)]"
                >
                  <option value="mombasa">Mombasa (Free)</option>
                  <option value="nairobi">Nairobi (+Ksh 300)</option>
                  <option value="upcountry">Upcountry (+Ksh 500)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Phone Number (for M-Pesa)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-[var(--bg-card)] text-[var(--text-primary)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Enter the phone number to receive M-Pesa prompt</p>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={(e) => setIsGift(e.target.checked)}
                    className="w-4 h-4 text-[var(--accent)] rounded"
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">This is a gift</span>
                </label>
              </div>

              {isGift && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Gift Message (optional)</label>
                  <textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    rows={3}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-[var(--bg-card)] text-[var(--text-primary)]"
                  />
                </div>
              )}
            </div>

            <div className="bg-[var(--bg-card)] rounded-xl p-6 shadow-sm border border-[var(--border)]">
              <h2 className="font-semibold text-lg mb-4 text-[var(--text-primary)]">Payment</h2>
              <div className="flex items-center gap-3 p-4 bg-[var(--bg-secondary)] rounded-lg">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <div>
                  <div className="font-medium text-[var(--text-primary)]">M-Pesa</div>
                  <div className="text-sm text-[var(--text-muted)]">Pay securely via Safaricom</div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing || !phone}
                className="w-full mt-6 py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--text-muted)] text-white font-semibold rounded-lg transition-colors"
              >
                {processing ? 'Processing...' : `Pay Ksh ${formatKsh(cart.total)} with M-Pesa`}
              </button>
            </div>
          </>
        ) : (
          <div className="bg-[var(--bg-card)] rounded-xl p-8 shadow-sm border border-[var(--border)] text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Payment Initiated!</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Please check your phone for an M-Pesa prompt and enter your PIN to complete payment.
            </p>
            <p className="text-sm text-[var(--text-muted)]">Order #{orderId}</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Waiting for payment confirmation...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-secondary)] pt-24 pb-12">
          <div className="max-w-2xl mx-auto px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-[var(--border)] rounded w-1/3"></div>
              <div className="bg-[var(--bg-card)] p-6 rounded-xl h-64"></div>
            </div>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
