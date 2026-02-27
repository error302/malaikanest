'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'

interface Stats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  lowStock: any[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStock: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [analyticsRes, productsRes, ordersRes] = await Promise.all([
          api.get('/api/orders/admin/analytics/'),
          api.get('/api/products/products/'),
          api.get('/api/orders/orders/'),
        ])
        
        setStats({
          totalRevenue: analyticsRes.data.total_revenue || 0,
          totalOrders: analyticsRes.data.total_orders || 0,
          totalProducts: productsRes.data.length || 0,
          lowStock: analyticsRes.data.low_stock || [],
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
    { label: 'Low Stock Items', value: stats.lowStock.length, icon: '⚠️', color: 'bg-red-500' },
  ]

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

      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <a href="/admin/products/new" className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition">
            + Add Product
          </a>
          <a href="/admin/categories" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
            Manage Categories
          </a>
          <a href="/admin/banners" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
            Manage Banners
          </a>
        </div>
      </div>
    </div>
  )
}
