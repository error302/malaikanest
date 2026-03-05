"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
      // Use withCredentials (httpOnly cookies) — no raw token reading from localStorage
      const res = await fetch('/api/orders/cart/', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setCart(data)
      } else if (res.status === 401) {
        router.push('/login?redirect=/checkout')
      }
    } catch (err) {
      console.error('Failed to fetch cart', err)
      setError('Failed to load cart')
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
      setOrderId(parseInt(pendingOrder))
      setPaymentInitiated(true)
    }
  }, [searchParams])

  const handleCheckout = async () => {
    setError('')
    setProcessing(true)

    try {
      // All requests use withCredentials (httpOnly cookies) — no localStorage token reading
      const checkoutRes = await fetch('/api/orders/cart/checkout/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_region: deliveryRegion,
          is_gift: isGift,
          gift_message: giftMessage,
        }),
      })

      if (!checkoutRes.ok) {
        const err = await checkoutRes.json()
        throw new Error(err.detail || 'Checkout failed')
      }

      const order = await checkoutRes.json()
      setOrderId(order.id)

      const paymentRes = await fetch('/api/payments/mpesa/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          phone: phone.replace(/\D/g, ''),
        }),
      })

      if (!paymentRes.ok) {
        const err = await paymentRes.json()
        throw new Error(err.detail || 'Payment initiation failed')
      }

      setPaymentInitiated(true)
      pollPaymentStatus(order.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setProcessing(false)
    }
  }

  const pollPaymentStatus = async (orderId: number) => {
    let attempts = 0
    const maxAttempts = 30
    let consecutiveErrors = 0

    const poll = async () => {
      attempts++
      try {
        const res = await fetch(`/api/orders/orders/${orderId}/`, {
          credentials: 'include',
        })
        if (res.ok) {
          const order = await res.json()
          consecutiveErrors = 0
          if (order.status === 'paid') {
            router.push(`/checkout/success?order_id=${orderId}`)
            return
          }
          if (order.status === 'payment_failed' || order.status === 'cancelled' || order.status === 'failed') {
            setError('Payment was not completed. Please try again.')
            setProcessing(false)
            return
          }
        } else if (res.status === 401) {
          router.push('/login?redirect=/checkout')
          return
        }
      } catch (err) {
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
      <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="bg-white p-6 rounded-xl h-64"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!cart || (cart.items.length === 0 && !paymentInitiated)) {
    return (
      <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center py-16">
          <h1 className="text-2xl font-semibold text-text mb-4">Your cart is empty</h1>
          <a href="/categories" className="text-cta hover:underline">Continue shopping</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-semibold text-text mb-6">Checkout</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!paymentInitiated ? (
          <>
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-secondary/50">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {cart.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>Ksh {(parseInt(item.product.price) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-secondary mt-4 pt-4 flex justify-between font-semibold">
                <span>Total</span>
                <span>Ksh {parseInt(cart.total).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-secondary/50">
              <h2 className="font-semibold text-lg mb-4">Delivery Details</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Region</label>
                <select
                  value={deliveryRegion}
                  onChange={e => setDeliveryRegion(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                >
                  <option value="mombasa">Mombasa (Free)</option>
                  <option value="nairobi">Nairobi (+Ksh 300)</option>
                  <option value="upcountry">Upcountry (+Ksh 500)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (for M-Pesa)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the phone number to receive M-Pesa prompt</p>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={e => setIsGift(e.target.checked)}
                    className="w-4 h-4 text-cta rounded"
                  />
                  <span className="text-sm font-medium">This is a gift</span>
                </label>
              </div>

              {isGift && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gift Message (optional)</label>
                  <textarea
                    value={giftMessage}
                    onChange={e => setGiftMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    rows={3}
                    className="w-full px-4 py-3 border border-secondary rounded-lg focus:ring-2 focus:ring-cta focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary/50">
              <h2 className="font-semibold text-lg mb-4">Payment</h2>
              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <div>
                  <div className="font-medium">M-Pesa</div>
                  <div className="text-sm text-gray-500">Pay securely via Safaricom</div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing || !phone}
                className="w-full mt-6 py-4 bg-cta hover:bg-cta-hover disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
              >
                {processing ? 'Processing...' : `Pay Ksh ${parseInt(cart.total).toLocaleString()} with M-Pesa`}
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-secondary/50 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">Payment Initiated!</h2>
            <p className="text-gray-600 mb-4">
              Please check your phone for an M-Pesa prompt and enter your PIN to complete payment.
            </p>
            <p className="text-sm text-gray-500">Order #{orderId}</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
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
    <Suspense fallback={
      <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="bg-white p-6 rounded-xl h-64"></div>
          </div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
