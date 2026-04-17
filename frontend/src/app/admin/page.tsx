'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, ShoppingBag, Package, Users, DollarSign, Plus, Eye, User, ArrowRight } from 'lucide-react'
import api from '@/lib/api'

interface Stats {
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  totalCustomers: number
  totalRevenue: number
}

interface RecentOrder {
  id: number
  order_number: string
  customer_name: string
  customer_email?: string
  total: string
  status: string
  created_at: string
}

interface MonthlyPoint {
  month: string | null
  revenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/api/orders/admin/analytics/')
      const data = res.data || {}

      setStats({
        totalOrders: Number(data.total_orders || 0),
        pendingOrders: Number(data.pending_orders || 0),
        totalProducts: Number(data.total_products || 0),
        totalCustomers: Number(data.total_users || 0),
        totalRevenue: Number(data.total_revenue || 0),
      })
      setRecentOrders(data.recent_orders || [])
      setMonthlyRevenue(data.monthly || [])
    } catch (error) {
      console.error('Error fetching admin analytics:', error)
      setStats({ totalOrders: 0, pendingOrders: 0, totalProducts: 0, totalCustomers: 0, totalRevenue: 0 })
      setRecentOrders([])
      setMonthlyRevenue([])
    } finally {
      setLoading(false)
    }
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
      initiated: 'bg-sky-100 text-sky-700 border-sky-200',
      paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      shipped: 'bg-purple-100 text-purple-700 border-purple-200',
      delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
      payment_failed: 'bg-rose-100 text-rose-700 border-rose-200',
      failed: 'bg-rose-100 text-rose-700 border-rose-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const salesChartData = useMemo(() => {
    const points = monthlyRevenue.length > 0 ? monthlyRevenue : [{ month: null, revenue: 0 }]
    return {
      labels: points.map((point) => {
        if (!point.month) return 'N/A'
        return new Date(`${point.month}-01`).toLocaleDateString('en-KE', { month: 'short' })
      }),
      data: points.map((point) => Number(point.revenue || 0)),
    }
  }, [monthlyRevenue])

  const maxChartValue = Math.max(...salesChartData.data, 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-[#E8D5B5]"></div>
          <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#8B6914] border-t-transparent animate-spin"></div>
        </div>
      </div>
    )
  }

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      bg: 'bg-gradient-to-br from-[#8B6914]/10 to-[#C9A96E]/10',
      iconBg: 'bg-[#8B6914]',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      bg: 'bg-gradient-to-br from-[#C4704A]/10 to-[#E8A88A]/10',
      iconBg: 'bg-[#C4704A]',
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Package,
      bg: 'bg-gradient-to-br from-amber-100 to-amber-50',
      iconBg: 'bg-amber-500',
    },
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: TrendingUp,
      bg: 'bg-gradient-to-br from-emerald-100 to-emerald-50',
      iconBg: 'bg-emerald-500',
    },
  ]

  const quickActions = [
    {
      label: 'Add Product',
      desc: 'Create new listing',
      icon: Plus,
      href: '/admin/products/new',
      gradient: 'from-[#8B6914] to-[#6B5310]',
    },
    {
      label: 'View Orders',
      desc: 'Process pending orders',
      icon: Eye,
      href: '/admin/orders',
      gradient: 'from-[#5C4033] to-[#3D2B1F]',
    },
    {
      label: 'Customers',
      desc: 'Manage customers',
      icon: User,
      href: '/admin/customers',
      gradient: 'from-[#C4704A] to-[#B45F3A]',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#2C1810] font-serif">Dashboard</h2>
          <p className="text-[#8A7060] mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#8A7060]">
            Last updated: {new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div key={idx} className={`relative overflow-hidden rounded-2xl p-6 shadow-warm-sm hover:shadow-warm-md transition-all duration-300 group ${kpi.bg}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#5C4033] mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-[#2C1810] font-serif">{kpi.value}</p>
                </div>
                <div className={`${kpi.iconBg} p-3 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/30 blur-2xl"></div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-warm-sm border border-[#E8E0D5] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#2C1810] font-serif">Sales Overview</h3>
            <span className="text-sm text-[#8A7060]">Last 6 months</span>
          </div>
          <div className="h-64 flex items-end justify-between gap-3">
            {salesChartData.data.map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-[#8A7060]">{formatCurrency(value)}</span>
                  <div
                    className="w-full max-w-[40px] bg-gradient-to-t from-[#8B6914] to-[#C9A96E] rounded-t-lg transition-all duration-500 hover:from-[#6B5310] hover:to-[#8B6914]"
                    style={{ height: `${(value / maxChartValue) * 160}px`, minHeight: value > 0 ? '8px' : '0' }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-[#8A7060]">{salesChartData.labels[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-warm-sm border border-[#E8E0D5] p-6">
          <h3 className="text-lg font-semibold text-[#2C1810] font-serif mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <Link key={idx} href={action.href} className="flex items-center gap-4 p-4 rounded-xl border border-[#E8E0D5] hover:border-[#8B6914]/30 hover:shadow-warm-sm transition-all duration-200 group">
                  <div className={`p-2.5 rounded-xl text-white shadow-lg bg-gradient-to-br ${action.gradient} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#2C1810]">{action.label}</p>
                    <p className="text-sm text-[#8A7060]">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#E8E0D5] group-hover:text-[#8B6914] group-hover:translate-x-1 transition-all" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-warm-sm border border-[#E8E0D5] overflow-hidden">
        <div className="p-6 border-b border-[#E8E0D5] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#2C1810] font-serif">Recent Orders</h3>
            <p className="text-sm text-[#8A7060] mt-0.5">Latest transactions from your store</p>
          </div>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5EFE6] text-[#8B6914] rounded-xl font-medium text-sm hover:bg-[#E8D5B5] transition-colors">
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5EFE6] flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-[#C9A96E]" />
            </div>
            <p className="text-[#5C4033] font-medium">No orders yet</p>
            <p className="text-sm text-[#8A7060] mt-1">Orders will appear here when customers purchase</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAF4EC]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C4033] uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C4033] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C4033] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C4033] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C4033] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D5]">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF4EC]/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#2C1810]">#{order.order_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B6914] to-[#C4704A] flex items-center justify-center text-white text-xs font-semibold">
                          {order.customer_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <span className="text-sm text-[#5C4033] block">{order.customer_name}</span>
                          {order.customer_email && <span className="text-xs text-[#8A7060]">{order.customer_email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#2C1810]">{formatCurrency(parseFloat(order.total) || 0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#8A7060]">{formatDate(order.created_at)}</span>
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
