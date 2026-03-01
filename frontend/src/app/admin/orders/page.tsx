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
  user: number
  user_email: string
  items: OrderItem[]
  total: string
  status: string
  payment_status: string
  shipping_address: string
  shipping_phone: string
  shipping_name: string
  delivery_region: string
  receipt_number: string
  created_at: string
  updated_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

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
      // Refresh selected order
      const res = await api.get(`/api/products/admin/orders/${selectedOrder.id}/`)
      setSelectedOrder(res.data)
      alert('Order status updated successfully!')
    } catch (error) {
      alert('Failed to update order status')
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
          .company { font-size: 24px; font-weight: bold; color: #B45309; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #B45309; color: white; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">Malaika Nest</div>
          <div>Baby Shop Kenya</div>
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
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="total">
          Total: KES ${parseFloat(order.total).toLocaleString()}
        </div>
        
        <div class="footer">
          <p>Thank you for shopping with Malaika Nest!</p>
          <p>Questions? Contact us at malaikanest7@gmail.com</p>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
    printWindow.print()
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-amber-700 text-white">
            <tr>
              <th className="px-6 py-4 text-left">Order #</th>
              <th className="px-6 py-4 text-left">Customer</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-left">Total</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Payment</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 font-medium text-gray-800">
                  {order.order_number}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {order.shipping_name}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-gray-800">
                  KES {parseFloat(order.total).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${statusColors[order.status] || 'bg-gray-100'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${paymentStatusColors[order.payment_status] || 'bg-gray-100'}`}>
                    {order.payment_status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No orders yet
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Order #{selectedOrder.order_number}</h2>
                  <p className="text-gray-500">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedOrder.shipping_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedOrder.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedOrder.shipping_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Region</p>
                    <p className="font-medium">{selectedOrder.delivery_region}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Shipping Address</p>
                    <p className="font-medium">{selectedOrder.shipping_address}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Order Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm">Product</th>
                        <th className="px-4 py-2 text-center text-sm">Qty</th>
                        <th className="px-4 py-2 text-right text-sm">Price</th>
                        <th className="px-4 py-2 text-right text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-2">{item.product_name}</td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">KES {item.price_at_purchase.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">KES {(item.price_at_purchase * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-bold">Total</td>
                        <td className="px-4 py-2 text-right font-bold">KES {parseFloat(selectedOrder.total).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status Update */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={updatingStatus || selectedOrder.status === status}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        selectedOrder.status === status
                          ? statusColors[status] + ' cursor-default'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => printInvoice(selectedOrder)}
                  className="flex-1 bg-amber-700 text-white py-3 rounded-lg hover:bg-amber-800 transition font-medium"
                >
                  🖨️ Print Invoice
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
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
