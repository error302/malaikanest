"use client"
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

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

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const router = useRouter()

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch('/api/orders/cart/', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setCart(data)
      }
    } catch (err) {
      // Cart fetch error — silently ignore (guest may not have cart yet)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const updateQuantity = async (itemId: number, newQty: number) => {
    if (newQty < 1) return
    setUpdating(itemId)
    try {
      const res = await fetch('/api/orders/cart/add/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: itemId, quantity: newQty })
      })
      if (res.ok) {
        await fetchCart()
      }
    } catch {
      // silently ignore
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: number) => {
    setUpdating(itemId)
    try {
      const res = await fetch(`/api/orders/cart/remove/${itemId}/`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        await fetchCart()
      }
    } catch {
      // silently ignore
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-4 rounded-xl h-24"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-semibold text-text mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Add some items to get started</p>
          <Link
            href="/categories"
            className="inline-block px-8 py-3 bg-cta hover:bg-cta-hover text-white font-semibold rounded-lg transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-semibold text-text mb-6">Shopping Cart ({cart.items.length} items)</h1>

        <div className="space-y-4 mb-8">
          {cart.items.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 flex gap-4 shadow-sm border border-secondary/50"
            >
              <Link href={`/products/${item.product.slug}`} className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.product.image ? (
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🧸</div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.slug}`} className="font-medium text-text hover:text-cta transition-colors line-clamp-1">
                  {item.product.name}
                </Link>
                <div className="text-sm text-gray-500 mt-1">
                  Ksh {parseInt(item.product.price).toLocaleString()}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      disabled={updating === item.product.id}
                      className="w-8 h-8 bg-secondary rounded flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={updating === item.product.id}
                      className="w-8 h-8 bg-secondary rounded flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-text">
                      Ksh {(parseInt(item.product.price) * item.quantity).toLocaleString()}
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      disabled={updating === item.product.id}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary/50">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-text">Ksh {parseInt(cart.subtotal || '0').toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-4 text-sm text-gray-500">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex justify-between pt-4 border-t border-secondary">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-bold text-xl text-text">Ksh {parseInt(cart.total || '0').toLocaleString()}</span>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="w-full mt-6 py-4 bg-cta hover:bg-cta-hover text-white font-semibold rounded-lg transition-colors"
          >
            Proceed to Checkout
          </button>

          <Link
            href="/categories"
            className="block text-center mt-3 text-sm text-gray-500 hover:text-cta transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
