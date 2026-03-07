"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react'

import api from '../lib/api'
import { useCart } from '../lib/cartContext'
import MiniCart from './MiniCart'
import Logo from './Logo'

interface Category {
  id: number
  name: string
  slug: string
}

const primaryNav = [
  { label: 'Shop', href: '/categories' },
  { label: 'New Arrivals', href: '/categories?sort=new' },
  { label: 'Categories', href: '/categories' },
  { label: 'Best Sellers', href: '/categories' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])

  const { items, remove, updateQty } = useCart()

  const cartCount = useMemo(() => items.reduce((sum, item) => sum + (item.qty || 1), 0), [items])

  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    api
      .get('/api/products/categories/')
      .then((res) => setCategories(Array.isArray(res.data) ? res.data.slice(0, 8) : []))
      .catch(() => setCategories([]))
  }, [pathname])

  useEffect(() => {
    setMobileOpen(false)
    setCartOpen(false)
    setSearchOpen(false)
  }, [pathname])

  if (pathname.startsWith('/admin')) return null

  const runSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    router.push(`/categories?search=${encodeURIComponent(value)}`)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-default bg-[var(--bg-primary)]/95 backdrop-blur">
      <div className="container-shell relative">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="min-w-0">
            <Logo className="max-w-full" />
          </div>

          <nav className="hidden items-center justify-center gap-8 lg:flex" aria-label="Primary">
            {primaryNav.map((item) => (
              <Link key={item.label} href={item.href} className="text-[15px] font-medium text-[var(--text-primary)] transition-colors hover:text-[#8f6a65]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-default bg-surface text-[var(--text-primary)]"
            >
              <Search size={18} />
            </button>

            <Link
              href="/login"
              aria-label="Account"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-default bg-surface text-[var(--text-primary)]"
            >
              <User size={18} />
            </Link>

            <button
              type="button"
              aria-label="Cart"
              onClick={() => setCartOpen((prev) => !prev)}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-default bg-surface text-[var(--text-primary)]"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--text-primary)] px-1 text-[11px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-default bg-surface text-[var(--text-primary)] lg:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4">
            <form onSubmit={runSearch} className="flex gap-2">
              <input
                className="input-soft"
                placeholder="Search products"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="btn-primary px-6">Search</button>
            </form>
          </div>
        )}

        {mobileOpen && (
          <div className="mb-4 rounded-xl border border-default bg-surface p-4 lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile Primary">
              {primaryNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-lg px-3 py-3 text-[15px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-soft)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 border-t border-default pt-3">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Popular Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories?category=${cat.slug}`}
                    className="rounded-full border border-default px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {cartOpen && (
          <div className="absolute right-0 top-[84px] z-50 w-[min(92vw,24rem)]">
            <MiniCart items={items} onRemove={remove} onUpdateQty={updateQty} />
          </div>
        )}
      </div>
    </header>
  )
}
