"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

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
      // Guest may not have a cart yet.
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
      await api.post('/api/orders/cart/add/', { product_id: productId, quantity: newQty })
      await fetchCart()
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
      await api.post(`/api/orders/cart/remove/${productId}/`)
      await fetchCart()
    } catch {
      setError('Failed to remove cart item.')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--border)] rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[var(--bg-card)] p-4 rounded-xl h-24"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Your cart is empty</h1>
          <p className="text-[var(--text-muted)] mb-8">Add some items to get started</p>
          <Link
            href="/categories"
            className="inline-block px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-lg transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Shopping Cart ({cart.items.length} items)</h1>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="space-y-4 mb-8">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-[var(--bg-card)] rounded-xl p-4 flex gap-4 shadow-sm border border-[var(--border)]"
            >
              <Link href={`/products/${item.product.slug}`} className="w-24 h-24 bg-[var(--bg-secondary)] rounded-lg overflow-hidden flex-shrink-0 relative">
                {item.product.image ? (
                  <Image src={item.product.image} alt={item.product.name} fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🧸</div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.slug}`} className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors line-clamp-1">
                  {item.product.name}
                </Link>
                <div className="text-sm text-[var(--text-muted)] mt-1">Ksh {formatKsh(item.product.price)}</div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      disabled={updating === item.product.id}
                      className="w-8 h-8 bg-[var(--bg-secondary)] rounded flex items-center justify-center hover:bg-[var(--border)] transition-colors disabled:opacity-50 text-[var(--text-primary)]"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium text-[var(--text-primary)]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={updating === item.product.id}
                      className="w-8 h-8 bg-[var(--bg-secondary)] rounded flex items-center justify-center hover:bg-[var(--border)] transition-colors disabled:opacity-50 text-[var(--text-primary)]"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-[var(--text-primary)]">Ksh {formatKsh(toMoneyNumber(item.product.price) * item.quantity)}</div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      disabled={updating === item.product.id}
                      className="text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl p-6 shadow-sm border border-[var(--border)]">
          <div className="flex justify-between mb-2">
            <span className="text-[var(--text-secondary)]">Subtotal</span>
            <span className="text-[var(--text-primary)]">Ksh {formatKsh(cart.subtotal || '0')}</span>
          </div>
          <div className="flex justify-between mb-4 text-sm text-[var(--text-muted)]">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex justify-between pt-4 border-t border-[var(--border)]">
            <span className="font-semibold text-lg text-[var(--text-primary)]">Total</span>
            <span className="font-bold text-xl text-[var(--text-primary)]">Ksh {formatKsh(cart.total || '0')}</span>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="w-full mt-6 py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-lg transition-colors"
          >
            Proceed to Checkout
          </button>

          <Link
            href="/categories"
            className="block text-center mt-3 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
