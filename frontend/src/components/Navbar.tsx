"use client"
import React, { useState, useEffect } from 'react'
import api from '../lib/api'
import Link from 'next/link'
import MiniCart from './MiniCart'
import { useCart } from '../lib/cartContext'
import Logo from './Logo'
import DarkModeToggle from './DarkModeToggle'
import { getCachedData, setCachedData } from '../lib/cache'
import { Search, ShoppingCart, Menu, X, ChevronDown, User } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
  group: string
  is_top_level: boolean
  parent: number | null
  children: Category[]
}

const CATEGORIES_CACHE_KEY = 'navbar_categories'

function NavbarContent() {
  const [isOpen, setIsOpen] = useState(false)
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let isMounted = true

    const cached = getCachedData<Category[]>(CATEGORIES_CACHE_KEY)
    if (cached) {
      setCategories(cached)
    }

    api.get('/api/products/categories/')
      .then(res => {
        if (isMounted) {
          setCategories(res.data)
          setCachedData(CATEGORIES_CACHE_KEY, res.data, 5 * 60 * 1000)
        }
      })
      .catch(err => console.error('Failed to load categories', err))

    return () => {
      isMounted = false
    }
  }, [])

  const { items, remove, updateQty } = useCart()

  const topLevelCategories = categories.filter((c) => c.is_top_level || c.parent === null)
  const featuredTopCategories = topLevelCategories.slice(0, 6)

  const ageGroups = [
    { name: 'Newborn 0-12m', href: '/?age=newborn-0-12m' },
    { name: 'Baby 1-3y', href: '/?age=baby-1-3y' },
    { name: 'Toddler 3-5y', href: '/?age=toddler-3-5y' },
    { name: 'Kids 6-8y', href: '/?age=kids-6-8y' },
    { name: 'Big Kids 9-12y', href: '/?age=big-kids-9-12y' },
  ]

  const navGroups = [
    { name: 'Home', href: '/' },
    { name: 'Girls Clothing', href: '/?category=girls-clothing' },
    { name: 'Boys Clothing', href: '/?category=boys-clothing' },
    { name: 'Baby Accessories', href: '/?category=baby-accessories' },
    { name: 'Toys & Gifts', href: '/?category=toys-learning' },
    { name: 'Collections', href: '/categories' },
    { name: 'Nursery', href: '/?category=nursery' },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur">
      <div className="top-banner">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-between text-xs sm:text-sm">
          <p className="font-medium truncate pr-4">Free Kenyan Delivery on Orders Over KSh 10,000+</p>
          <div className="hidden sm:flex items-center gap-4">
            <span>KES</span>
            <Link href="/login" className="hover:text-[var(--accent)] transition-colors">Login</Link>
            <Link href="/account/orders" className="hover:text-[var(--accent)] transition-colors">My Account</Link>
            <Link href="/admin/login" className="hover:text-[var(--accent)] transition-colors">Admin</Link>
            {mounted && <DarkModeToggle />}
          </div>
          <div className="sm:hidden">{mounted && <DarkModeToggle />}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16 gap-3">
          <Logo variant="default" linkWrapper={true} />

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search clothes, toys, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 input-soft"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/login"
              className="p-2 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-[12px] transition-all shadow-[var(--shadow-accent)]"
            >
              Sign In
            </Link>
            <button
              onClick={() => setShowCart((s) => !s)}
              aria-label="Cart"
              className="relative p-2 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--accent)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {items.length}
                </span>
              )}
            </button>
            {showCart && (
              <div className="absolute right-4 top-16 z-50">
                <MiniCart items={items} onRemove={remove} onUpdateQty={updateQty} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setShowCart((s) => !s)}
              aria-label="Cart"
              className="relative p-2 text-[var(--text-primary)]"
            >
              <ShoppingCart className="w-6 h-6" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--accent)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {items.length}
                </span>
              )}
            </button>
            <button
              className="p-2 text-[var(--text-primary)]"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-5 h-12 border-t border-[var(--border)]">
          <div className="group relative">
            <button className="h-12 flex items-center gap-1 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
              Shop by Age
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute top-full left-0 w-64 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow-lg)] transition-all">
              <div className="flex flex-col">
                {ageGroups.map((group) => (
                  <Link key={group.name} href={group.href} className="px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-card-hover)]">
                    {group.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {navGroups.map((group) => (
            <Link key={group.name} href={group.href} className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
              {group.name}
            </Link>
          ))}
          <Link href="/lookbook" className="ml-auto text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
            Lookbook
          </Link>
        </div>

        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 input-soft"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          </div>
        </form>

        {isOpen && (
          <div className="md:hidden py-3 border-t border-[var(--border)]">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
              <button
                className="w-full flex items-center justify-between px-2 py-3 text-left font-medium text-[var(--text-primary)]"
                onClick={() => setOpenMobileGroup(openMobileGroup === 'age' ? null : 'age')}
              >
                <span>Shop by Age</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openMobileGroup === 'age' ? 'rotate-180' : ''}`} />
              </button>
              {openMobileGroup === 'age' && (
                <div className="pb-2 px-2 flex flex-col gap-1">
                  {ageGroups.map((group) => (
                    <Link key={group.name} href={group.href} className="py-2 text-sm text-[var(--text-secondary)]" onClick={() => setIsOpen(false)}>
                      {group.name}
                    </Link>
                  ))}
                </div>
              )}
              <div className="h-px bg-[var(--border)] my-2" />
              <div className="flex flex-col gap-1">
                {navGroups.map((group) => (
                  <Link key={group.name} href={group.href} className="px-2 py-2.5 text-sm font-medium text-[var(--text-primary)]" onClick={() => setIsOpen(false)}>
                    {group.name}
                  </Link>
                ))}
                {featuredTopCategories.map((groupCat) => (
                  <Link key={groupCat.id} href={`/?category=${groupCat.slug}`} className="px-2 py-2 text-xs text-[var(--text-secondary)]" onClick={() => setIsOpen(false)}>
                    {groupCat.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/login"
                className="mt-2 px-4 py-3 text-[var(--text-primary)] hover:text-[var(--accent)] font-medium text-center block"
                onClick={() => setIsOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/login"
                className="px-4 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-[12px] transition-colors text-center block mt-2"
                onClick={() => setIsOpen(false)}
              >
                Continue
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default NavbarContent
