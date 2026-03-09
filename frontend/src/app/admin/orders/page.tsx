'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface OrderItem {
  id: number
  product_name: string
  price_at_purchase: number
  quantity: number
}

interface Order {
  id: number
  order_number: string
  user_email: string
  customer_name: string
  items: OrderItem[]
  total: string
  status: string
  payment_status: string
  created_at: string
  receipt_number?: string
  mpesa_receipt_number?: string
  shipping_phone?: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async (): Promise<Order[]> => {
    try {
      const res = await api.get('/api/products/admin/orders/')
      const data = Array.isArray(res.data) ? res.data : res.data?.results || []
      setOrders(data)
      return data
    } catch {
      setOrders([])
      return []
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedOrder) return
    setActionLoading(true)
    setActionError('')

    try {
      await api.patch(`/api/products/admin/orders/${selectedOrder.id}/update_status/`, { status: newStatus })
      const latest = await fetchOrders()
      const refreshed = latest.find((o) => o.id === selectedOrder.id)
      setSelectedOrder(refreshed || null)
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || 'Failed to update order status.')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
  const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

  if (loading) return <div className="p-6">Loading orders...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Orders</h2>
        <div className="flex gap-2 flex-wrap">
          {['all', ...statuses].map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={`px-3 py-2 rounded-lg text-sm ${filter === status ? 'bg-amber-600 text-white' : 'bg-slate-100'}`}>
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs">Order ID</th>
              <th className="px-4 py-3 text-left text-xs">Customer</th>
              <th className="px-4 py-3 text-left text-xs">Total</th>
              <th className="px-4 py-3 text-left text-xs">Status</th>
              <th className="px-4 py-3 text-left text-xs">Date</th>
              <th className="px-4 py-3 text-left text-xs">M-Pesa Receipt</th>
              <th className="px-4 py-3 text-left text-xs"></th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="px-4 py-3 text-sm">{order.order_number || `#${order.id}`}</td>
                <td className="px-4 py-3 text-sm">{order.customer_name || order.user_email}</td>
                <td className="px-4 py-3 text-sm">KES {Number(order.total).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">{order.status}</td>
                <td className="px-4 py-3 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm">{order.mpesa_receipt_number || '-'}</td>
                <td className="px-4 py-3"><button onClick={() => setSelectedOrder(order)} className="px-3 py-1 bg-slate-100 rounded text-xs">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Order {selectedOrder.order_number || `#${selectedOrder.id}`}</h3>
              <button onClick={() => setSelectedOrder(null)}>Close</button>
            </div>

            <div className="space-y-2 text-sm mb-6">
              <p><strong>Customer:</strong> {selectedOrder.customer_name || selectedOrder.user_email}</p>
              <p><strong>Email:</strong> {selectedOrder.user_email}</p>
              <p><strong>Phone:</strong> {selectedOrder.shipping_phone || '-'}</p>
              <p><strong>Payment:</strong> {selectedOrder.payment_status || selectedOrder.status}</p>
            </div>

            <table className="w-full text-sm border">
              <thead className="bg-slate-50">
                <tr><th className="p-2 text-left">Item</th><th className="p-2">Qty</th><th className="p-2 text-right">Price</th></tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.id} className="border-t"><td className="p-2">{item.product_name}</td><td className="p-2 text-center">{item.quantity}</td><td className="p-2 text-right">KES {Number(item.price_at_purchase).toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>

            {actionError && (
              <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button key={status} onClick={() => handleStatusUpdate(status)} disabled={actionLoading} className="px-3 py-2 bg-slate-100 rounded text-xs disabled:opacity-50">
                  {actionLoading ? 'Updating...' : `Set ${status}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
