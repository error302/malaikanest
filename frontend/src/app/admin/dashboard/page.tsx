'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'

interface Stats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalUsers: number
  lowStock: any[]
  recentOrders: any[]
  monthly: any[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    lowStock: [],
    recentOrders: [],
    monthly: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const analyticsRes = await api.get('/api/orders/admin/analytics/')
        
        setStats({
          totalRevenue: analyticsRes.data.total_revenue || 0,
          totalOrders: analyticsRes.data.total_orders || 0,
          totalProducts: analyticsRes.data.total_products || 0,
          totalUsers: analyticsRes.data.total_users || 0,
          lowStock: analyticsRes.data.low_stock || [],
          recentOrders: analyticsRes.data.recent_orders || [],
          monthly: analyticsRes.data.monthly || [],
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { label: 'Total Revenue', value: `KSh ${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: 'bg-green-500' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '🛒', color: 'bg-blue-500' },
    { label: 'Total Products', value: stats.totalProducts, icon: '📦', color: 'bg-purple-500' },
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-amber-500' },
  ]

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
            <Link href="/admin/orders" className="text-amber-700 hover:text-amber-800 text-sm">
              View All →
            </Link>
          </div>
          {stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{order.order_number}</p>
                    <p className="text-sm text-gray-500">{order.user_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">KSh {order.total.toLocaleString()}</p>
                    <span className={`px-2 py-1 text-xs rounded ${statusColors[order.status] || 'bg-gray-100'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No orders yet</p>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Low Stock Alerts</h2>
            <Link href="/admin/products" className="text-amber-700 hover:text-amber-800 text-sm">
              Manage Products →
            </Link>
          </div>
          {stats.lowStock.length > 0 ? (
            <div className="space-y-3">
              {stats.lowStock.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{item.product}</p>
                    <p className="text-sm text-red-600">Only {item.available} left in stock</p>
                  </div>
                  <span className="text-red-600 font-bold">⚠️</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">All products are well stocked</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/products/new" className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition">
            + Add Product
          </Link>
          <Link href="/admin/categories" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
            Manage Categories
          </Link>
          <Link href="/admin/banners" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
            Manage Banners
          </Link>
          <Link href="/admin/customers" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  )
}
