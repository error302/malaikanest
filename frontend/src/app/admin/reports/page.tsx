'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface ReportData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  totalCustomers: number
  topProducts: { name: string; quantity: number; revenue: number }[]
  ordersByStatus: { status: string; count: number }[]
  revenueByMonth: { month: string; revenue: number }[]
  recentTransactions: {
    id: number
    order_number: string
    customer: string
    amount: number
    status: string
    date: string
  }[]
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/orders/admin/reports/?days=${dateRange}`)
      setReportData(res.data)
    } catch (error) {
      console.error('Error fetching reports:', error)
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async () => {
    setExporting(true)
    try {
      const response = await api.get('/api/orders/admin/orders/export/', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      alert('Failed to export orders. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg">Unable to load report data</p>
        <p className="text-sm">Please ensure the backend API is running</p>
        <button 
          onClick={fetchReportData}
          className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <div className="flex gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={exportToCSV}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : '📥 Export Orders'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            KES {reportData?.totalRevenue.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {reportData?.totalOrders || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500 text-sm">Average Order Value</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            KES {reportData?.averageOrderValue.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500 text-sm">Total Customers</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {reportData?.totalCustomers || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Products</h2>
          <div className="space-y-4">
            {reportData?.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-700">{product.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">KES {product.revenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{product.quantity} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Orders by Status</h2>
          <div className="space-y-4">
            {reportData?.ordersByStatus.map((item, index) => {
              const percentage = reportData.totalOrders > 0 
                ? Math.round((item.count / reportData.totalOrders) * 100) 
                : 0
              return (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="capitalize font-medium text-gray-700">{item.status}</span>
                    <span className="text-gray-500">{item.count} orders ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'delivered' ? 'bg-green-500' :
                        item.status === 'shipped' ? 'bg-purple-500' :
                        item.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Month</h2>
        <div className="h-64 flex items-end gap-4">
          {reportData?.revenueByMonth.map((item, index) => {
            const maxRevenue = Math.max(...(reportData.revenueByMonth.map(r => r.revenue)))
            const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-amber-500 rounded-t-lg transition-all hover:bg-amber-600" style={{ height: `${height}%`, minHeight: '10px' }}></div>
                <p className="mt-2 text-sm text-gray-600">{item.month}</p>
                <p className="text-xs text-gray-500">KES {(item.revenue / 1000).toFixed(1)}k</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {reportData ? Math.round(reportData.totalOrders / (parseInt(dateRange) / 30)) : 0}
            </p>
            <p className="text-sm text-gray-500">Orders/Month</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {reportData?.topProducts[0]?.name || 'N/A'}
            </p>
            <p className="text-sm text-gray-500">Best Seller</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {reportData?.ordersByStatus.find(o => o.status === 'delivered')?.count || 0}
            </p>
            <p className="text-sm text-gray-500">Completed Orders</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {reportData?.ordersByStatus.find(o => o.status === 'pending')?.count || 0}
            </p>
            <p className="text-sm text-gray-500">Pending Orders</p>
          </div>
        </div>
      </div>
    </div>
  )
}

