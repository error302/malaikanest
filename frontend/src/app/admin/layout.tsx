'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '📦' },
  { href: '/admin/categories', label: 'Categories', icon: '📁' },
  { href: '/admin/banners', label: 'Banners', icon: '🖼️' },
  { href: '/admin/orders', label: 'Orders', icon: '🛒' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('/accounts/users/me/')
      } catch {
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await api.post('/accounts/users/logout/')
    } catch {}
    localStorage.removeItem('access_token')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-amber-800 text-white shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/admin/dashboard" className="text-xl font-bold">
            Malaika Nest Admin
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <nav className="p-4">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                  pathname === link.href
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
