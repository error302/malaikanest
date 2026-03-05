"use client"
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Order = {
  id: number
  receipt_number: string
  status: string
  subtotal: string
  total: string
  delivery_region: string
  is_gift: boolean
  gift_message: string
  created_at: string
  items: Array<{
    id: number
    product: { name: string; image: string }
    quantity: number
    price: string
  }>
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  initiated: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const router = useRouter()

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders/orders/', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.results || data)
      } else if (res.status === 401) {
        router.push('/login?redirect=/account/orders')
      }
    } catch (err) {
      console.error('Failed to fetch orders', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            {[1, 2].map(i => (
              <div key={i} className="bg-white p-6 rounded-xl h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-text">My Orders</h1>
          <Link href="/account" className="text-cta hover:underline text-sm">
            ← Back to Account
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-secondary/50">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-text mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
            <Link
              href="/categories"
              className="inline-block px-6 py-3 bg-cta hover:bg-cta-hover text-white font-semibold rounded-lg transition-colors"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-secondary/50 overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-secondary/20 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-text">Order #{order.id}</div>
                      <div className="text-sm text-gray-500">{formatDate(order.created_at)}</div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <div className="text-lg font-bold text-text mt-1">
                        Ksh {parseInt(order.total).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="border-t border-secondary p-4 bg-secondary/10">
                    <div className="space-y-3 mb-4">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                            {item.product.image ? (
                              <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">🧸</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-text">{item.product.name}</div>
                            <div className="text-xs text-gray-500">Qty: {item.quantity} × Ksh {parseInt(item.price).toLocaleString()}</div>
                          </div>
                          <div className="text-sm font-medium text-text">
                            Ksh {(parseInt(item.price) * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-secondary pt-3 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Subtotal</span>
                        <span>Ksh {parseInt(order.subtotal).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Delivery</span>
                        <span>{order.delivery_region === 'upcountry' ? 'Ksh 500' : 'Free'}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>Ksh {parseInt(order.total).toLocaleString()}</span>
                      </div>
                    </div>

                    {order.is_gift && (
                      <div className="mt-3 p-3 bg-pink-50 rounded-lg">
                        <div className="text-xs text-pink-600 font-medium mb-1">🎁 Gift Order</div>
                        {order.gift_message && (
                          <p className="text-sm text-gray-600 italic">"{order.gift_message}"</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
