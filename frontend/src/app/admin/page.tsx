'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface Stats {
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  totalCustomers: number
  totalRevenue?: number
}

interface RecentOrder {
  id: number
  order_number: string
  customer_name: string
  total: string
  status: string
  created_at: string
}

interface ChartData {
  labels: string[]
  data: number[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, totalProducts: 0, totalCustomers: 0, totalRevenue: 0 })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [salesChartData, setSalesChartData] = useState<ChartData>({ labels: [], data: [] })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        api.get('/api/orders/orders/'),
        api.get('/api/products/products/'),
        api.get('/api/accounts/users/')
      ])
      
      const orders = ordersRes.data
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0)
      
      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
        totalProducts: productsRes.data.length,
        totalCustomers: usersRes.data.length,
        totalRevenue
      })
      setRecentOrders(orders.slice(0, 6))

      const last7Days = getLast7Days()
      const salesByDay = last7Days.map(day => {
        return orders
          .filter((o: any) => o.created_at?.startsWith(day))
          .reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0)
      })
      setSalesChartData({
        labels: last7Days.map(d => new Date(d).toLocaleDateString('en-KE', { weekday: 'short' })),
        data: salesByDay
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLast7Days = (): string[] => {
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
    return days
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-KE', { month: 'short', day: 'numeric' }).format(new Date(dateStr))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      shipped: 'bg-purple-100 text-purple-700 border-purple-200',
      delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      cancelled: 'bg-rose-100 text-rose-700 border-rose-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const maxChartValue = Math.max(...salesChartData.data, 1)

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

  const kpiCards = [
    { 
      label: 'Total Revenue', 
      value: formatCurrency(stats.totalRevenue), 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'linear-gradient(135deg, #E6F2FF 0%, #DBEAFE 100%)',
      iconBg: 'bg-blue-500',
      trend: '+12.5%',
      trendUp: true
    },
    { 
      label: 'Total Orders', 
      value: stats.totalOrders, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      bg: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 100%)',
      iconBg: 'bg-rose-500',
      trend: '+8.2%',
      trendUp: true
    },
    { 
      label: 'Pending Orders', 
      value: stats.pendingOrders, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'linear-gradient(135deg, #FFF8E7 0%, #FEF3C7 100%)',
      iconBg: 'bg-amber-500',
      trend: '-3.1%',
      trendUp: false
    },
    { 
      label: 'Total Products', 
      value: stats.totalProducts, 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      bg: 'linear-gradient(135deg, #E8F8F5 0%, #A7F3D0 100%)',
      iconBg: 'bg-emerald-500',
      trend: '+5.4%',
      trendUp: true
    },
  ]

  const quickActions = [
    { 
      label: 'Add Product', 
      desc: 'Create new listing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      href: '/admin/products/new',
      gradient: 'from-amber-600 to-amber-700'
    },
    { 
      label: 'View Orders', 
      desc: 'Process pending orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      href: '/admin/orders',
      gradient: 'from-slate-600 to-slate-700'
    },
    { 
      label: 'Customers', 
      desc: 'Manage customers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/admin/customers',
      gradient: 'from-violet-600 to-violet-700'
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>Dashboard</h2>
          <p className="text-slate-500 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            Last updated: {new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiCards.map((kpi, idx) => (
          <div 
            key={idx}
            className="relative overflow-hidden rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group"
            style={{ background: kpi.bg }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 mb-1">{kpi.label}</p>
                <p className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>{kpi.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-xs font-semibold ${kpi.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpi.trend}
                  </span>
                  <span className="text-xs text-slate-400">vs last week</span>
                </div>
              </div>
              <div className={`${kpi.iconBg} p-3 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {kpi.icon}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/20 blur-2xl"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>Sales Overview</h3>
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-3">
            {salesChartData.data.map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-slate-500">{formatCurrency(value)}</span>
                  <div 
                    className="w-full max-w-[40px] bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all duration-500 hover:from-amber-600 hover:to-amber-500"
                    style={{ height: `${(value / maxChartValue) * 160}px`, minHeight: value > 0 ? '8px' : '0' }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-slate-400">{salesChartData.labels[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, idx) => (
              <Link
                key={idx}
                href={action.href}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 group"
              >
                <div className={`p-2.5 rounded-xl text-white shadow-lg ${action.gradient} group-hover:scale-110 transition-transform duration-200`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{action.label}</p>
                  <p className="text-sm text-slate-500">{action.desc}</p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>Recent Orders</h3>
            <p className="text-sm text-slate-500 mt-0.5">Latest transactions from your store</p>
          </div>
          <Link 
            href="/admin/orders" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-medium text-sm hover:bg-amber-100 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No orders yet</p>
            <p className="text-sm text-slate-400 mt-1">Orders will appear here when customers purchase</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">#{order.order_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold">
                          {order.customer_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm text-slate-600">{order.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{formatCurrency(parseFloat(order.total) || 0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{formatDate(order.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
