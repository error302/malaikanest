"use client"
import React, { useState, useEffect } from 'react'
import api from '../lib/api'
import Link from 'next/link'
import MiniCart from './MiniCart'
import { useCart } from '../lib/cartContext'
import Logo from './Logo'
import { getCachedData, setCachedData } from '../lib/cache'
import { Search, ShoppingCart, Menu, X, ChevronDown } from 'lucide-react'

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
  const [categories, setCategories] = useState<Category[]>([])
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let mounted = true
    
    // Check cache first
    const cached = getCachedData<Category[]>(CATEGORIES_CACHE_KEY)
    if (cached) {
      setCategories(cached)
    }
    
    // Fetch fresh data and update cache
    api.get('/api/products/categories/')
      .then(res => {
        if (mounted) {
          setCategories(res.data)
          // Cache for 5 minutes
          setCachedData(CATEGORIES_CACHE_KEY, res.data, 5 * 60 * 1000)
        }
      })
      .catch(err => console.error("Failed to load categories", err))
    return () => { mounted = false }
  }, [])

  const { items, remove, updateQty } = useCart()

  // Group categories by their group field for mega menu
  const topLevelCategories = categories.filter((c: Category) => c.is_top_level || c.parent === null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-primary shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Logo variant="default" linkWrapper={true} />

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search Baby Products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-button text-white placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            </div>
          </form>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/" className="px-3 py-2 text-white hover:text-accent transition-colors font-medium text-[15px]">
              Home
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setIsCategoriesOpen(true)}
              onMouseLeave={() => setIsCategoriesOpen(false)}
            >
              <button className="px-3 py-2 text-white hover:text-accent transition-colors flex items-center gap-1 font-medium text-[15px]">
                Shop
                <ChevronDown 
                  className={`w-4 h-4 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Mega Menu */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 top-full w-[700px] bg-card shadow-xl rounded-b-xl border-t-4 border-accent z-50 transition-all duration-200 ${
                  isCategoriesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                }`}
              >
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-6">
                    {topLevelCategories.slice(0, 8).map((groupCat: Category) => (
                      <div key={groupCat.id}>
                        <h4 className="font-bold text-accent border-b border-border pb-2 mb-3">{groupCat.name}</h4>
                        <ul className="space-y-2 text-sm">
                          {groupCat.children && groupCat.children.length > 0 ? (
                            groupCat.children.slice(0, 5).map((child: Category) => (
                              <li key={child.id}>
                                <Link href={`/?category=${child.slug}`} className="text-muted hover:text-accent transition-colors block">
                                  {child.name}
                                </Link>
                              </li>
                            ))
                          ) : (
                            <li>
                              <Link href={`/?category=${groupCat.slug}`} className="text-muted hover:text-accent transition-colors block">
                                View All
                              </Link>
                            </li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                    <Link href="/categories" className="text-sm font-medium text-accent hover:text-accent/80">
                      View All Categories →
                    </Link>
                    <Link href="/categories" className="text-sm bg-accent text-white px-4 py-2 rounded-button hover:bg-accent-hover transition-colors">
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/account/orders" className="px-3 py-2 text-white hover:text-accent transition-colors font-medium text-[15px]">
              My Orders
            </Link>
            
            {/* Log In */}
            <Link 
              href="/login" 
              className="px-4 py-2 text-white hover:text-accent transition-colors font-medium text-[15px]"
            >
              Log In
            </Link>

            {/* Get Started Button */}
            <Link 
              href="/login" 
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-button transition-all shadow-button"
            >
              Get Started
            </Link>

            {/* Cart */}
            <button 
              onClick={() => setShowCart(s => !s)} 
              aria-label="Cart" 
              className="relative p-2 text-white hover:text-accent transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
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

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={() => setShowCart(s => !s)} 
              aria-label="Cart" 
              className="relative p-2 text-white"
            >
              <ShoppingCart className="w-6 h-6" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {items.length}
                </span>
              )}
            </button>
            <button
              className="p-2 text-white"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-button text-white placeholder-muted focus:outline-none focus:border-accent"
          />
        </form>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              <Link href="/" className="px-3 py-2 text-white hover:text-accent font-medium" onClick={() => setIsOpen(false)}>
                Home
              </Link>
              <Link href="/categories" className="px-3 py-2 text-white hover:text-accent font-medium" onClick={() => setIsOpen(false)}>
                Categories
              </Link>
              <Link href="/bundle" className="px-3 py-2 text-white hover:text-accent font-medium" onClick={() => setIsOpen(false)}>
                Bundle Builder
              </Link>
              <Link 
                href="/login" 
                className="px-4 py-3 text-white hover:text-accent font-medium text-center"
                onClick={() => setIsOpen(false)}
              >
                Log In
              </Link>
              <Link 
                href="/login" 
                className="px-4 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-button transition-colors text-center mx-2 mt-2"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default NavbarContent

