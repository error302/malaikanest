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
  items: OrderItem[]
  total: string
  status: string
  payment_status: string
  shipping_address: string
  shipping_phone: string
  shipping_name: string
  delivery_region: string
  created_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/products/admin/orders/')
      setOrders(res.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedOrder) return
    setUpdatingStatus(true)
    try {
      await api.patch(`/api/products/admin/orders/${selectedOrder.id}/update_status/`, {
        status: newStatus
      })
      fetchOrders()
      const res = await api.get(`/api/products/admin/orders/${selectedOrder.id}/`)
      setSelectedOrder(res.data)
    } catch (error) {
      console.error('Failed to update order status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const printInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">KES ${item.price_at_purchase.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">KES ${(item.price_at_purchase * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('')

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.order_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company { font-size: 24px; font-weight: bold; color: #8B5E3C; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #8B5E3C; color: white; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">Malaika Nest</div>
          <div>Premium Baby & Maternity</div>
        </div>
        <div class="invoice-details">
          <div>
            <strong>Invoice #:</strong> ${order.order_number}<br>
            <strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}
          </div>
          <div>
            <strong>Customer:</strong> ${order.shipping_name}<br />
            <strong>Email:</strong> ${order.user_email}<br />
            <strong>Phone:</strong> ${order.shipping_phone}
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="total">Total: KES ${parseFloat(order.total).toLocaleString()}</div>
        <div class="footer"><p>Thank you for shopping with Malaika Nest!</p></div>
      </body>
      </html>
    `
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
    printWindow.print()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      shipped: 'bg-purple-100 text-purple-700 border-purple-200',
      delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      cancelled: 'bg-rose-100 text-rose-700 border-rose-200'
    }
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const getPaymentColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      failed: 'bg-rose-100 text-rose-700 border-rose-200'
    }
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-amber-100"></div>
          <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-amber-600 border-t-transparent animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>Orders</h2>
          <p className="text-slate-500 mt-1">Manage and process customer orders</p>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800">#{order.order_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold">
                        {order.shipping_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm text-slate-600">{order.shipping_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(order.created_at)}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800">{formatCurrency(parseFloat(order.total) || 0)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No orders found</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>Order #{selectedOrder.order_number}</h3>
                  <p className="text-slate-500 text-sm mt-1">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-slate-700 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Name</p>
                    <p className="font-medium text-slate-800">{selectedOrder.shipping_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Email</p>
                    <p className="font-medium text-slate-800">{selectedOrder.user_email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Phone</p>
                    <p className="font-medium text-slate-800">{selectedOrder.shipping_phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Region</p>
                    <p className="font-medium text-slate-800">{selectedOrder.delivery_region}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400">Address</p>
                    <p className="font-medium text-slate-800">{selectedOrder.shipping_address}</p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-slate-800">{item.product_name}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">{formatCurrency(item.price_at_purchase)}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">{formatCurrency(item.price_at_purchase * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-800">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-700">{formatCurrency(parseFloat(selectedOrder.total))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 mb-3">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={updatingStatus || selectedOrder.status === status}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedOrder.status === status
                          ? getStatusColor(status) + ' cursor-default'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => printInvoice(selectedOrder)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-600/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Invoice
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-8 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
