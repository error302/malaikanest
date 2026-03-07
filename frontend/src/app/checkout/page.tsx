"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, ChevronLeft, Loader2, ShieldCheck } from 'lucide-react'

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

function toMpesaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.length === 9) return `254${digits}`
  return digits
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
  const hasStartedPolling = useRef(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/api/orders/cart/')
      setCart(res.data)
      setError('')
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

  const pollPaymentStatus = useCallback(
    async (oid: number) => {
      let attempts = 0
      const maxAttempts = 30
      let consecutiveErrors = 0

      const poll = async () => {
        attempts += 1
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

          consecutiveErrors += 1
          if (consecutiveErrors >= 3) {
            setError('Network error while checking payment status. Check order history or contact support.')
            setProcessing(false)
            return
          }
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 5000)
        } else {
          setError('Payment verification timed out. If you were charged, your order will confirm shortly.')
          setProcessing(false)
        }
      }

      setTimeout(poll, 3000)
    },
    [router]
  )

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  useEffect(() => {
    const pendingOrder = searchParams.get('order_id')
    if (pendingOrder) {
      hasStartedPolling.current = false
      setOrderId(parseInt(pendingOrder, 10))
      setPaymentInitiated(true)
      setProcessing(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!paymentInitiated || !orderId || hasStartedPolling.current) return
    hasStartedPolling.current = true
    pollPaymentStatus(orderId)
  }, [orderId, paymentInitiated, pollPaymentStatus])

  const phoneValue = useMemo(() => toMpesaPhone(phone), [phone])
  const phoneLooksValid = /^254\d{9}$/.test(phoneValue)

  const handleCheckout = async () => {
    setError('')

    if (!phoneLooksValid) {
      setError('Enter a valid M-Pesa phone number (e.g. 07XXXXXXXX or 2547XXXXXXXX).')
      return
    }

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
        phone: phoneValue,
      })

      hasStartedPolling.current = false
      setPaymentInitiated(true)
    } catch (err: unknown) {
      setError(handleApiError(err))
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="pb-20 pt-10">
        <div className="container-shell">
          <div className="animate-pulse space-y-6">
            <div className="h-9 w-64 rounded bg-[var(--bg-soft)]" />
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
              <div className="h-[520px] rounded-[12px] border border-default bg-surface" />
              <div className="h-[420px] rounded-[12px] border border-default bg-surface" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cart || (cart.items.length === 0 && !paymentInitiated)) {
    return (
      <div className="pb-20 pt-10">
        <div className="container-shell">
          <div className="card-soft mx-auto max-w-2xl p-10 text-center">
            <h1 className="font-display text-[36px] text-[var(--text-primary)]">Your cart is empty</h1>
            <p className="mt-3 text-[18px] text-[var(--text-secondary)]">Add products before checkout.</p>
            <Link href="/categories" className="btn-primary mt-8 inline-flex px-7">Back to Shop</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="mb-8">
          <Link href="/cart" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            <ChevronLeft size={16} />
            Back to Cart
          </Link>
          <h1 className="font-display text-[36px] text-[var(--text-primary)]">Checkout</h1>
          <p className="mt-2 text-[18px] text-[var(--text-secondary)]">Complete your order securely.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!paymentInitiated ? (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <section className="space-y-6">
              <article className="card-soft p-6">
                <h2 className="font-display text-[28px] text-[var(--text-primary)]">Delivery Details</h2>

                <div className="mt-5 space-y-4">
                  <label className="block text-sm font-medium text-[var(--text-primary)]">
                    Delivery Region
                    <select
                      value={deliveryRegion}
                      onChange={(e) => setDeliveryRegion(e.target.value)}
                      className="input-soft mt-2"
                    >
                      <option value="mombasa">Mombasa (Free)</option>
                      <option value="nairobi">Nairobi (+KES 300)</option>
                      <option value="upcountry">Upcountry (+KES 500)</option>
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-[var(--text-primary)]">
                    M-Pesa Phone Number
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                      className="input-soft mt-2"
                    />
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">Use the number that will receive the STK prompt.</p>
                  </label>

                  <label className="inline-flex items-center gap-3 pt-1 text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={isGift}
                      onChange={(e) => setIsGift(e.target.checked)}
                      className="h-4 w-4 rounded border-default"
                    />
                    This is a gift
                  </label>

                  {isGift && (
                    <label className="block text-sm font-medium text-[var(--text-primary)]">
                      Gift Message (optional)
                      <textarea
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Add your note"
                        rows={4}
                        className="input-soft mt-2 resize-y"
                      />
                    </label>
                  )}
                </div>
              </article>

              <article className="card-soft p-6">
                <h2 className="font-display text-[28px] text-[var(--text-primary)]">Payment Method</h2>
                <div className="mt-5 rounded-[12px] border border-default bg-[var(--bg-soft)] p-4">
                  <p className="font-semibold text-[var(--text-primary)]">M-Pesa STK Push</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">You will receive a secure phone prompt to approve payment.</p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processing || !phoneLooksValid}
                  className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processing ? 'Processing...' : `Pay KES ${formatKsh(cart.total)} with M-Pesa`}
                </button>
              </article>
            </section>

            <aside className="lg:sticky lg:top-28">
              <div className="card-soft p-6">
                <h2 className="font-display text-[28px] text-[var(--text-primary)]">Order Summary</h2>

                <div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 border-b border-default pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-[var(--text-primary)]">{item.product.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Qty {item.quantity}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
                        KES {formatKsh(toMoneyNumber(item.product.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-3 text-[16px]">
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span>KES {formatKsh(cart.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span>Shipping</span>
                    <span>By region</span>
                  </div>
                  <div className="border-t border-default pt-3 text-[var(--text-primary)]">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-[24px] font-semibold">KES {formatKsh(cart.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-2 rounded-[12px] border border-default bg-[var(--bg-soft)] p-3 text-sm text-[var(--text-secondary)]">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                  Protected checkout and secure payment processing.
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <section className="card-soft mx-auto max-w-2xl p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-[var(--text-primary)]">
              <CheckCircle2 size={30} />
            </div>
            <h2 className="font-display mt-5 text-[36px] text-[var(--text-primary)]">Payment Initiated</h2>
            <p className="mx-auto mt-3 max-w-lg text-[18px] text-[var(--text-secondary)]">
              Check your phone and approve the M-Pesa prompt to complete your order.
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Order #{orderId}</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-default bg-[var(--bg-soft)] px-4 py-2 text-sm text-[var(--text-secondary)]">
              <Loader2 size={16} className="animate-spin" />
              Waiting for payment confirmation...
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="pb-20 pt-10">
          <div className="container-shell">
            <div className="animate-pulse space-y-6">
              <div className="h-9 w-64 rounded bg-[var(--bg-soft)]" />
              <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
                <div className="h-[520px] rounded-[12px] border border-default bg-surface" />
                <div className="h-[420px] rounded-[12px] border border-default bg-surface" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
