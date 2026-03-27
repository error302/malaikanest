"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ShieldCheck } from 'lucide-react'

import api, { handleApiError } from '@/lib/api'
import MpesaCheckout from '@/components/MpesaCheckout'

type CartData = {
  id: number
  items: Array<{
    id: number
    product: { id: number; name: string; price: string; image: string }
    quantity: number
  }>
  subtotal: string
  discount?: string
  total: string
}

const DELIVERY_FEES: Record<string, number> = {
  mombasa: 0,
  nairobi: 300,
  upcountry: 500,
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
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [deliveryRegion, setDeliveryRegion] = useState('nairobi')
  const [isGift, setIsGift] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState<number | null>(null)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const router = useRouter()

  const fetchCart = useCallback(async () => {
    setLoading(true)
    try {
      await api.get('/api/v1/accounts/profile/')
      const res = await api.get('/api/v1/orders/cart/')
      setCart(res.data)
      setRequiresAuth(false)
      setError('')
    } catch (err: unknown) {
      const msg = handleApiError(err)
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('invalid refresh token')) {
        setRequiresAuth(true)
        setError('')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const subtotal = useMemo(() => toMoneyNumber(cart?.subtotal || '0'), [cart?.subtotal])
  const discount = useMemo(() => toMoneyNumber(cart?.discount || '0'), [cart?.discount])
  const deliveryFee = useMemo(() => DELIVERY_FEES[deliveryRegion] ?? 0, [deliveryRegion])
  const payableTotal = useMemo(() => Math.max(subtotal - discount, 0) + deliveryFee, [subtotal, discount, deliveryFee])
  const includedVat = useMemo(() => (subtotal - discount) - (subtotal - discount) / 1.16, [subtotal, discount])

  const prepareOrder = useCallback(async () => {
    if (orderId) return orderId

    setError('')

    try {
      const checkoutRes = await api.post('/api/v1/orders/cart/checkout/', {
        delivery_region: deliveryRegion,
        is_gift: isGift,
        gift_message: giftMessage,
      })

      const createdOrderId = Number(checkoutRes.data?.id)
      if (!createdOrderId) {
        throw new Error('Order could not be created.')
      }

      setOrderId(createdOrderId)
      setPaymentInitiated(true)
      return createdOrderId
    } catch (err: unknown) {
      setError(handleApiError(err))
      throw err
    }
  }, [deliveryRegion, giftMessage, isGift, orderId])

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

  if (requiresAuth) {
    return (
      <div className="pb-20 pt-10">
        <div className="container-shell">
          <div className="card-soft mx-auto max-w-2xl p-10 text-center">
            <h1 className="font-display text-[36px] text-[var(--text-primary)]">Create an account to continue checkout</h1>
            <p className="mt-3 text-[18px] text-[var(--text-secondary)]">
              Guests need an account to complete payment, track orders, and receive updates.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register?next=/checkout" className="btn-primary inline-flex px-7">Create Account</Link>
              <Link href="/login?next=/checkout" className="btn-secondary inline-flex px-7">Sign In</Link>
            </div>
            <div className="mt-4">
              <Link href="/cart" className="text-sm font-medium text-[var(--text-secondary)] underline">Back to Cart</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
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

              <div className="mt-6">
                <MpesaCheckout
                  orderId={orderId}
                  totalAmount={payableTotal}
                  onPrepareOrder={prepareOrder}
                  onInitiate={(_checkoutRequestId, createdOrderId) => {
                    setOrderId(createdOrderId)
                    setPaymentInitiated(true)
                    setError('')
                  }}
                  onSuccess={(receipt, createdOrderId) => {
                    const params = new URLSearchParams({ order_id: String(createdOrderId) })
                    if (receipt) params.set('receipt', receipt)
                    router.push(`/checkout/success?${params.toString()}`)
                  }}
                  onFailure={(message) => {
                    setError(message || 'Payment failed or was cancelled. Please try again.')
                  }}
                />
              </div>
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
                  <span>KES {formatKsh(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span>Discount</span>
                    <span className="text-green-700">- KES {formatKsh(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[var(--text-secondary)] text-sm">
                  <span>VAT (16% incl.)</span>
                  <span>KES {formatKsh(includedVat)}</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span>Shipping</span>
                  <span>KES {formatKsh(deliveryFee)}</span>
                </div>
                <div className="border-t border-default pt-3 text-[var(--text-primary)]">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-[24px] font-semibold">KES {formatKsh(payableTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-[12px] border border-default bg-[var(--bg-soft)] p-3 text-sm text-[var(--text-secondary)]">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--text-primary)]" />
                <p>Your payment is secured and your order will only be confirmed after payment succeeds.</p>
              </div>

              {paymentInitiated && orderId && (
                <div className="mt-4 rounded-[12px] border border-default bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  Order reference: <span className="font-semibold text-[var(--text-primary)]">#{orderId}</span>
                </div>
              )}
            </div>
          </aside>
        </div>
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
