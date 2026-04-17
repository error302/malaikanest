"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Minus, Plus, ShieldCheck, Trash2, ShoppingBag, Package, Truck, Heart } from 'lucide-react'

import api from '@/lib/api'
import { shouldUseUnoptimizedImage } from '@/lib/media'

type CartItem = {
  id: number
  product: {
    id: number
    name: string
    slug: string
    price: string
    image: string
    stock: number
    available_stock?: number
  }
  variant?: {
    id: number
    color?: string
    color_label?: string
    size?: string
    size_label?: string
    image?: string
    available_stock?: number
  } | null
  quantity: number
  unit_price?: string
}

type CartData = {
  id: number
  items: CartItem[]
  subtotal: string
  discount?: string
  delivery_fee?: string
  total: string
  coupon?: { code: string } | null
  delivery_region?: string
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
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const router = useRouter()

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/orders/cart/')
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

  const updateQuantity = async (productId: number, newQty: number, variantId?: number) => {
    if (newQty < 1) return
    setUpdating(variantId || productId)
    setError('')
    try {
      const res = await api.post('/api/v1/orders/cart/update/', { product_id: productId, variant_id: variantId, quantity: newQty })
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

  const removeItem = async (productId: number, variantId?: number) => {
    setUpdating(variantId || productId)
    setError('')
    try {
      const res = await api.post(`/api/v1/orders/cart/remove/${productId}/`, { variant_id: variantId })
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

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setError('')
    try {
      const res = await api.post('/api/v1/orders/cart/coupon/apply/', { code: couponCode.trim() })
      setCart(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to apply coupon.')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = async () => {
    setCouponLoading(true)
    setError('')
    try {
      const res = await api.post('/api/v1/orders/cart/coupon/remove/')
      setCart(res.data)
      setCouponCode('')
    } catch {
      setError('Failed to remove coupon.')
    } finally {
      setCouponLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-10 min-h-screen bg-[#FDF8F3]">
        <div className="max-w-[1380px] mx-auto px-6 lg:px-16">
          <div className="animate-pulse space-y-6">
            <div className="h-9 w-64 bg-[#F5EFE6] rounded" />
            <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-[#F5EFE6]" />
                ))}
              </div>
              <div className="h-72 rounded-2xl bg-[#F5EFE6]" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="py-10 min-h-screen bg-[#FDF8F3]">
        <div className="max-w-[1380px] mx-auto px-6 lg:px-16">
          <div className="bg-white rounded-3xl border border-[#E8E0D5] mx-auto max-w-2xl p-10 text-center md:p-14 shadow-warm-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F5EFE6]">
              <ShoppingBag className="text-[#8B6914]" size={32} />
            </div>
            <h1 className="font-serif text-3xl text-[#2C1810]">Your cart is empty</h1>
            <p className="mx-auto mt-3 max-w-md text-[#8A7060]">
              Start with your essentials and everything you add will stay ready here for checkout.
            </p>
            <Link href="/categories" className="btn-primary mt-8 inline-flex items-center justify-center gap-2 px-8 py-4">
              Explore Collection
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10 min-h-screen bg-[#FDF8F3]">
      <div className="max-w-[1380px] mx-auto px-6 lg:px-16">
        <div className="mb-8">
          <Link
            href="/categories"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#8A7060] transition-colors hover:text-[#8B6914]"
          >
            <ChevronLeft size={16} />
            Continue Shopping
          </Link>
          <h1 className="font-serif text-3xl text-[#2C1810]">Shopping Cart</h1>
          <p className="mt-2 text-[#8A7060]">
            {cart.items.length} item{cart.items.length === 1 ? '' : 's'} in your cart
          </p>
        </div>

        {error && <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Cart Items */}
          <section className="space-y-4">
            {cart.items.map((item) => {
              const lineTotal = toMoneyNumber(item.unit_price || item.product.price) * item.quantity
              const inStock = item.variant
                ? Number(item.variant.available_stock ?? 0) > 0
                : Number(item.product.available_stock ?? item.product.stock ?? 0) > 0
              const actionKey = item.variant?.id || item.product.id
              const displayImage = item.variant?.image || item.product.image

              return (
                <article key={item.id} className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8E0D5] shadow-warm-sm flex flex-col sm:flex-row gap-4">
                  {/* Product Image */}
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="relative aspect-square w-full sm:w-28 sm:h-28 overflow-hidden rounded-xl bg-[#F5EFE6] flex-shrink-0"
                  >
                    {displayImage ? (
                      <Image src={displayImage} alt={item.product.name} fill sizes="112px" className="object-cover" unoptimized={shouldUseUnoptimizedImage(displayImage)} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="w-10 h-10 text-[#C9A96E]" />
                      </div>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="text-lg font-semibold text-[#2C1810] transition-colors hover:text-[#8B6914]"
                    >
                      {item.product.name}
                    </Link>
                    {item.variant?.color_label && (
                      <p className="mt-1 text-sm text-[#8A7060]">Color: {item.variant.color_label}</p>
                    )}
                    <p className="mt-1 text-sm text-[#8A7060]">
                      KES {formatKsh(item.unit_price || item.product.price)} each
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      {/* Quantity Controls */}
                      <div className="inline-flex items-center rounded-xl bg-[#F5EFE6] p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                          disabled={updating === actionKey || item.quantity <= 1}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#2C1810] transition-colors hover:bg-white disabled:opacity-40"
                          aria-label={`Decrease quantity for ${item.product.name}`}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="inline-flex h-10 min-w-10 items-center justify-center px-2 text-base font-semibold text-[#2C1810]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                          disabled={updating === actionKey || !inStock}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#2C1810] transition-colors hover:bg-white disabled:opacity-40"
                          aria-label={`Increase quantity for ${item.product.name}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Price & Remove */}
                      <div className="text-right">
                        <p className="text-xl font-semibold text-[#2C1810]">KES {formatKsh(lineTotal)}</p>
                        <button
                          onClick={() => removeItem(item.product.id, item.variant?.id)}
                          disabled={updating === actionKey}
                          className="mt-1 inline-flex items-center gap-1 text-sm text-[#8A7060] transition-colors hover:text-red-600 disabled:opacity-50"
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

          {/* Order Summary */}
          <aside className="lg:sticky lg:top-28">
            <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-warm-sm p-6">
              <h2 className="font-serif text-2xl text-[#2C1810]">Order Summary</h2>

              {/* Coupon Section */}
              <div className="mt-5 rounded-xl bg-[#F5EFE6] p-4">
                <p className="text-sm font-semibold text-[#2C1810]">Have a coupon?</p>
                {cart.coupon?.code ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-[#8A7060]">
                      Applied: <span className="font-mono font-semibold text-[#2C1810]">{cart.coupon.code}</span>
                    </p>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      disabled={couponLoading}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      {couponLoading ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 bg-white border border-[#E8E0D5] rounded-lg px-4 py-2 text-sm text-[#2C1810] placeholder:text-[#8A7060] focus:outline-none focus:border-[#8B6914]"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-[#8B6914] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#6B5310] transition-colors disabled:opacity-60"
                    >
                      {couponLoading ? 'Applying…' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-[#8A7060]">
                  <span>Subtotal</span>
                  <span>KES {formatKsh(cart.subtotal || '0')}</span>
                </div>
                {toMoneyNumber(cart.discount || '0') > 0 && (
                  <div className="flex items-center justify-between text-[#8A7060]">
                    <span>Discount</span>
                    <span className="text-green-700">- KES {formatKsh(cart.discount || '0')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[#8A7060] text-sm">
                  <span>VAT (16% incl.)</span>
                  <span>KES {formatKsh(toMoneyNumber(cart.subtotal || '0') - (toMoneyNumber(cart.subtotal || '0') / 1.16))}</span>
                </div>
                <div className="flex items-center justify-between text-[#8A7060]">
                  <span>Shipping (est.)</span>
                  <span>KES {formatKsh(cart.delivery_fee || '0')}</span>
                </div>
                <div className="border-t border-[#E8E0D5] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-[#2C1810]">Total</span>
                    <span className="text-2xl font-semibold text-[#2C1810]">KES {formatKsh(cart.total || '0')}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button 
                onClick={() => router.push('/checkout')} 
                className="mt-6 w-full bg-[#8B6914] hover:bg-[#6B5310] text-white font-medium py-4 rounded-full transition-colors"
              >
                Proceed to Checkout
              </button>

              {/* Trust Badges */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[#8A7060]">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} /> Secure
                </span>
                <span className="flex items-center gap-1">
                  <Truck size={14} /> Fast Delivery
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
