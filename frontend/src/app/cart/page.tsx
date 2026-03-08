"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react'

import api from '@/lib/api'

type CartItem = {
  id: number
  product: {
    id: number
    name: string
    slug: string
    price: string
    image: string
    stock: number
  }
  quantity: number
}

type CartData = {
  id: number
  items: CartItem[]
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

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/api/orders/cart/')
      setCart(res.data)
      setError('')
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const updateQuantity = async (productId: number, newQty: number) => {
    if (newQty < 1) return
    setUpdating(productId)
    setError('')
    try {
      const res = await api.post('/api/orders/cart/update/', { product_id: productId, quantity: newQty })
      if (res?.data) {
        setCart(res.data)
      } else {
        await fetchCart()
      }
    } catch {
      setError('Failed to update cart item.')
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (productId: number) => {
    setUpdating(productId)
    setError('')
    try {
      const res = await api.post(`/api/orders/cart/remove/${productId}/`)
      if (res?.data) {
        setCart(res.data)
      } else {
        await fetchCart()
      }
    } catch {
      setError('Failed to remove cart item.')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="pb-20 pt-10">
        <div className="container-shell">
          <div className="animate-pulse space-y-6">
            <div className="h-9 w-64 rounded bg-[var(--bg-soft)]" />
            <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-[12px] border border-default bg-surface" />
                ))}
              </div>
              <div className="h-72 rounded-[12px] border border-default bg-surface" />
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
          <div className="card-soft mx-auto max-w-2xl p-10 text-center md:p-14">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-default bg-[var(--bg-soft)]">
              <ShieldCheck className="text-[var(--text-secondary)]" size={30} />
            </div>
            <h1 className="font-display text-[36px] text-[var(--text-primary)]">Your cart is empty</h1>
            <p className="mx-auto mt-3 max-w-md text-[18px] text-[var(--text-secondary)]">
              Start with your essentials and everything you add will stay ready here for checkout.
            </p>
            <Link href="/categories" className="btn-primary mt-8 inline-flex items-center justify-center gap-2 px-7">
              Explore Collection
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="mb-8">
          <Link
            href="/categories"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <ChevronLeft size={16} />
            Continue Shopping
          </Link>
          <h1 className="font-display text-[36px] text-[var(--text-primary)]">Shopping Cart</h1>
          <p className="mt-2 text-[18px] text-[var(--text-secondary)]">
            {cart.items.length} item{cart.items.length === 1 ? '' : 's'} selected
          </p>
        </div>

        {error && <div className="mb-6 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <section className="space-y-4">
            {cart.items.map((item) => {
              const lineTotal = toMoneyNumber(item.product.price) * item.quantity
              const inStock = item.product.stock === undefined || item.product.stock > 0

              return (
                <article key={item.id} className="card-soft flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="relative aspect-square w-full overflow-hidden rounded-[12px] border border-default bg-[var(--bg-soft)] sm:h-28 sm:w-28"
                  >
                    {item.product.image ? (
                      <Image src={item.product.image} alt={item.product.name} fill sizes="112px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)]">
                        <span className="font-display text-4xl text-[var(--text-primary)]">{item.product.name.charAt(0)}</span>
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="line-clamp-2 text-[22px] font-semibold text-[var(--text-primary)] transition-colors hover:text-[#8f6a65]"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">KES {formatKsh(item.product.price)} each</p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-[12px] border border-default bg-[var(--bg-soft)] p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          disabled={updating === item.product.id || item.quantity <= 1}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Decrease quantity for ${item.product.name}`}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="inline-flex h-11 min-w-11 items-center justify-center px-2 text-base font-semibold text-[var(--text-primary)]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={updating === item.product.id || !inStock}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Increase quantity for ${item.product.name}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-[20px] font-semibold text-[var(--text-primary)]">KES {formatKsh(lineTotal)}</p>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          disabled={updating === item.product.id}
                          className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] transition-colors hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>

          <aside className="lg:sticky lg:top-28">
            <div className="card-soft p-6">
              <h2 className="font-display text-[28px] text-[var(--text-primary)]">Order Summary</h2>

              <div className="mt-6 space-y-3 text-[16px]">
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span>KES {formatKsh(cart.subtotal || '0')}</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-secondary)] text-sm">
                  <span>VAT (16% incl.)</span>
                  <span>KES {formatKsh(toMoneyNumber(cart.subtotal || '0') - (toMoneyNumber(cart.subtotal || '0') / 1.16))}</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-default pt-3 text-[var(--text-primary)]">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-[24px] font-semibold">KES {formatKsh(cart.total || '0')}</span>
                  </div>
                </div>
              </div>

              <button onClick={() => router.push('/checkout')} className="btn-primary mt-6 w-full">
                Proceed to Checkout
              </button>

              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Secure checkout with protected payment flow.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
