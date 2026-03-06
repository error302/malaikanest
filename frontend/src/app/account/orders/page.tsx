"use client"

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import api, { handleApiError } from '@/lib/api'

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

const toMoneyNumber = (value: string | number): number => {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : 0
}

const formatKsh = (value: string | number): string =>
  new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toMoneyNumber(value))

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get('/api/orders/orders/')
      const data = response.data
      setOrders(data.results || data)
    } catch (err: unknown) {
      const message = handleApiError(err)
      if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('invalid refresh token')) {
        router.push('/login?redirect=/account/orders')
        return
      }
      setError(message)
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
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            {[1, 2].map((i) => (
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

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

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
            {orders.map((order) => (
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
                      <div className="text-lg font-bold text-text mt-1">Ksh {formatKsh(order.total)}</div>
                    </div>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="border-t border-secondary p-4 bg-secondary/10">
                    <div className="space-y-3 mb-4">
                      {order.items.map((item) => {
                        const lineTotal = toMoneyNumber(item.price) * item.quantity
                        return (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                              {item.product.image ? (
                                <Image
                                  src={item.product.image}
                                  alt={item.product.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl">🧸</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-text">{item.product.name}</div>
                              <div className="text-xs text-gray-500">Qty: {item.quantity} × Ksh {formatKsh(item.price)}</div>
                            </div>
                            <div className="text-sm font-medium text-text">Ksh {formatKsh(lineTotal)}</div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="border-t border-secondary pt-3 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Subtotal</span>
                        <span>Ksh {formatKsh(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Delivery</span>
                        <span>{order.delivery_region === 'upcountry' ? 'Ksh 500' : 'Free'}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>Ksh {formatKsh(order.total)}</span>
                      </div>
                    </div>

                    {order.is_gift && (
                      <div className="mt-3 p-3 bg-pink-50 rounded-lg">
                        <div className="text-xs text-pink-600 font-medium mb-1">🎁 Gift Order</div>
                        {order.gift_message && <p className="text-sm text-gray-600 italic">"{order.gift_message}"</p>}
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
