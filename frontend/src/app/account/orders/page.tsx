"use client"

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Download, FileText } from 'lucide-react'

import api, { handleApiError } from '@/lib/api'

type Order = {
  id: number
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

const statusStyles: Record<string, string> = {
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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div className="pb-20 pt-10">
        <div className="container-shell">
          <div className="animate-pulse space-y-4">
            <div className="h-9 w-48 rounded bg-[var(--bg-soft)]" />
            {[1, 2].map((i) => (
              <div key={i} className="h-36 rounded-[12px] border border-default bg-surface" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-[36px] text-[var(--text-primary)]">My Orders</h1>
          <Link href="/" className="text-sm font-medium text-[var(--text-secondary)] underline">Back Home</Link>
        </div>

        {error && <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {orders.length === 0 ? (
          <div className="card-soft p-10 text-center">
            <h2 className="text-[28px] font-semibold text-[var(--text-primary)]">No orders yet</h2>
            <p className="mt-2 text-[16px] text-[var(--text-secondary)]">Start shopping to see your order history.</p>
            <Link href="/categories" className="btn-primary mt-6 inline-flex px-7">Shop Now</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="card-soft overflow-hidden">
                <button
                  className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-[var(--bg-soft)]"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div>
                    <p className="text-[20px] font-semibold text-[var(--text-primary)]">Order #{order.id}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">KES {formatKsh(order.total)}</p>
                  </div>
                </button>

                {expandedOrder === order.id && (
                  <div className="border-t border-default bg-[var(--bg-soft)] p-4">
                    <div className="space-y-3">
                      {order.items.map((item) => {
                        const lineTotal = toMoneyNumber(item.price) * item.quantity
                        return (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-default bg-surface">
                              {item.product.image ? (
                                <Image src={item.product.image} alt={item.product.name} fill sizes="48px" className="object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">Item</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-sm font-medium text-[var(--text-primary)]">{item.product.name}</p>
                              <p className="text-xs text-[var(--text-secondary)]">Qty {item.quantity} × KES {formatKsh(item.price)}</p>
                            </div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">KES {formatKsh(lineTotal)}</p>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-4 border-t border-default pt-3 text-sm">
                      <div className="mb-1 flex justify-between text-[var(--text-secondary)]">
                        <span>Subtotal</span>
                        <span>KES {formatKsh(order.subtotal)}</span>
                      </div>
                      <div className="mb-1 flex justify-between text-[var(--text-secondary)]">
                        <span>Delivery</span>
                        <span>{order.delivery_region === 'upcountry' ? 'KES 500' : order.delivery_region === 'nairobi' ? 'KES 300' : 'Free'}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-[var(--text-primary)]">
                        <span>Total</span>
                        <span>KES {formatKsh(order.total)}</span>
                      </div>
                    </div>

                    {order.is_gift && (
                      <div className="mt-3 rounded-[12px] border border-default bg-surface p-3 text-sm text-[var(--text-secondary)]">
                        <p className="font-semibold text-[var(--text-primary)]">Gift Order</p>
                        {order.gift_message && <p className="mt-1 italic">&quot;{order.gift_message}&quot;</p>}
                      </div>
                    )}

                    {/* Download Invoice Button - Only for paid orders */}
                    {order.status === 'paid' && (
                      <div className="mt-4 pt-3 border-t border-default">
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/orders/${order.id}/invoice/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-[var(--accent-primary)] hover:underline"
                        >
                          <Download size={16} />
                          Download Invoice
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



