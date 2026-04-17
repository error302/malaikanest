'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Menu, X, LayoutDashboard, Package, ShoppingBag, FileText, Users, List, Image as ImageIcon, BarChart3, Settings, LogOut, ExternalLink } from 'lucide-react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/admin/invoices', icon: FileText, label: 'Invoices' },
  { href: '/admin/customers', icon: Users, label: 'Customers' },
  { href: '/admin/categories', icon: List, label: 'Categories' },
  { href: '/admin/banners', icon: ImageIcon, label: 'Banners' },
  { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

function AdminSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: any) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await api.post('/api/accounts/logout/')
    } catch (_e) {
      // Ignore logout errors
    } finally {
      router.refresh()
      router.replace('/admin/login')
      setLoggingOut(false)
    }
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white shadow-xl fixed h-full top-0 left-0 z-50 border-r border-[#E8E0D5] flex flex-col transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      >
        <div className="p-6 border-b border-[#E8E0D5] flex items-center justify-between">
          <Link href="/admin" className="block truncate">
            <span className={`text-2xl font-bold text-[#8B6914] font-serif`}>
              {collapsed ? 'M' : 'Malaika Nest'}
            </span>
            {!collapsed && (
              <p className="text-xs text-[#8A7060] mt-1 uppercase tracking-wider block">
                Admin Dashboard
              </p>
            )}
          </Link>
          <button className="lg:hidden text-[#5C4033]" onClick={() => setMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-[#8B6914]/10 text-[#8B6914] font-medium'
                    : 'text-[#5C4033] hover:bg-[#F5EFE6] hover:text-[#2C1810]'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#8B6914]' : 'group-hover:text-[#8B6914]'}`} />
                {!collapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[#E8E0D5] space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#5C4033] hover:bg-[#F5EFE6] hover:text-[#2C1810] transition-all duration-200 group"
            title={collapsed ? 'View Store' : undefined}
          >
            <ExternalLink className="w-5 h-5 flex-shrink-0 group-hover:text-[#8B6914] transition-colors" />
            {!collapsed && (
              <span className="text-sm truncate">View Store</span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#5C4033] hover:bg-red-50 hover:text-red-600 transition-all duration-200 group disabled:opacity-50"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:text-red-600 transition-colors" />
            {!collapsed && (
              <span className="text-sm truncate">{loggingOut ? 'Logging out...' : 'Logout'}</span>
            )}
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute top-6 -right-3 w-6 h-6 bg-[#8B6914] text-white rounded-full items-center justify-center shadow-md hover:bg-[#6B5310] transition-all"
        >
          <svg className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    </>
  )
}

function AdminHeader({ setMobileOpen }: any) {
  return (
    <header className="bg-white shadow-sm border-b border-[#E8E0D5] px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <button
          className="lg:hidden p-2 -ml-2 text-[#5C4033] hover:bg-[#F5EFE6] rounded-lg"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div className="relative w-full max-w-md hidden sm:block">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A7060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5EFE6] border border-[#E8E0D5] rounded-xl text-sm text-[#2C1810] placeholder-[#8A7060] focus:outline-none focus:ring-2 focus:ring-[#8B6914]/50 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B6914] to-[#C4704A] flex items-center justify-center text-white font-semibold shadow-lg">
            A
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-[#2C1810]">Admin</p>
            <p className="text-xs text-[#8A7060]">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    const verifyAdmin = async () => {
      try {
        await api.get('/api/accounts/admin/session/')
      } catch (_err) {
        router.replace('/admin/login')
      } finally {
        if (mounted) setAuthChecking(false)
      }
    }

    verifyAdmin()
    return () => { mounted = false }
  }, [router])

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F3] text-[#5C4033]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#8B6914] border-t-transparent rounded-full animate-spin" />
          Checking admin session...
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#FDF8F3] overflow-x-hidden">
      <AdminSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className={`flex-1 transition-all duration-300 min-w-0 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <AdminHeader setMobileOpen={setMobileOpen} />
        <main className="p-4 sm:p-8 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
