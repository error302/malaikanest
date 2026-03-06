'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import api from '@/lib/api'
import DarkModeToggle from '@/components/DarkModeToggle'

const navItems = [
  { href: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Dashboard', exact: true },
  { href: '/admin/products', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Products' },
  { href: '/admin/orders', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: 'Orders' },
  { href: '/admin/customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: 'Customers' },
  { href: '/admin/categories', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', label: 'Categories' },
  { href: '/admin/banners', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Banners' },
  { href: '/admin/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Reports' },
  { href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Settings' },
]

function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await api.post('/api/accounts/logout/')
    } catch (_e) {
      // Ignore logout errors, but still force navigation out of admin
    } finally {
      // Cookies are httpOnly and cleared by backend logout response
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
    <aside className={`bg-[var(--bg-card)] shadow-xl fixed h-full z-50 border-r border-[var(--border)] flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-6 border-b border-[var(--border)]">
        <Link href="/admin" className="block">
          <span className="text-2xl font-bold text-[var(--accent)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {collapsed ? 'M' : 'Malaika Nest'}
          </span>
        </Link>
        {!collapsed && (
          <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Admin Dashboard
          </p>
        )}
      </div>
      
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive(item.href, item.exact)
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
            }`}
            title={collapsed ? item.label : undefined}
          >
            <svg className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive(item.href, item.exact) ? 'text-[var(--accent)]' : 'group-hover:text-[var(--accent)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            {!collapsed && (
              <span className="text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--border)] space-y-1">
        <Link 
          href="/" 
          target="_blank"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-all duration-200 group"
          title={collapsed ? 'View Store' : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0 group-hover:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          {!collapsed && (
            <span className="text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>View Store</span>
          )}
        </Link>
        
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all duration-200 group disabled:opacity-50"
          title={collapsed ? 'Logout' : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && (
            <span className="text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>{loggingOut ? 'Logging out...' : 'Logout'}</span>
          )}
        </button>
      </div>
      
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-6 -right-3 w-6 h-6 bg-[var(--accent)] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[var(--accent-hover)] transition-all"
      >
        <svg className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  )
}

function AdminHeader() {
  return (
    <header className="bg-[var(--bg-card)] shadow-sm border-b border-[var(--border)] px-8 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search products, orders, customers..." 
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:bg-[var(--bg-card)] transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[var(--accent)] rounded-full border-2 border-[var(--bg-card)]"></span>
        </button>
        
        {/* Dark Mode Toggle */}
        <DarkModeToggle />
        
        <div className="h-8 w-px bg-[var(--border)]"></div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--pastel-pink)] flex items-center justify-center text-white font-semibold shadow-lg">
            A
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Admin</p>
            <p className="text-xs text-[var(--text-muted)]">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary)]">
      <AdminSidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <AdminHeader />
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

