"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

import api from '@/lib/api'
import { LoadingPage } from '@/components/Loading'

interface Order {
  id: number
  total: string
  status: string
  created_at: string
  receipt_number: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  initiated: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/api/orders/orders/')
      .then((r) => {
        setOrders(r.data.results || r.data)
        setLoading(false)
      })
      .catch(() => {
        setError('Unable to load orders. Please try again.')
        setLoading(false)
      })
  }, [])

  if (loading) return <LoadingPage />

  if (error)
    return (
      <div className="pb-20 pt-10">
        <div className="container-shell">
          <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        </div>
      </div>
    )

  const getStatusColor = (status: string) => statusColors[status] || 'bg-gray-100 text-gray-800'

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <h1 className="font-display mb-6 text-[36px] text-[var(--text-primary)]">My Orders</h1>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="card-soft p-10 text-center">
              <h2 className="text-[28px] font-semibold text-[var(--text-primary)]">No orders yet</h2>
              <p className="mt-2 text-[16px] text-[var(--text-secondary)]">Start shopping to see your orders here.</p>
              <Link href="/categories" className="btn-primary mt-6 inline-flex px-7">
                Browse Products
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="card-soft p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-[20px] font-semibold text-[var(--text-primary)]">Order #{order.id}</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {new Date(order.created_at).toLocaleDateString('en-KE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {order.receipt_number ? ` • Receipt: ${order.receipt_number.slice(0, 8)}...` : ''}
                    </p>
                  </div>
                  <div className="text-lg font-semibold text-[var(--text-primary)]">KES {parseFloat(order.total).toLocaleString()}</div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
