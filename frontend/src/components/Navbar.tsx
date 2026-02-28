"use client"
import React, { useState, useEffect } from 'react'
import api from '../lib/api'
import Link from 'next/link'
import MiniCart from './MiniCart'
import { useCart } from '../lib/cartContext'
import Logo from './Logo'

interface Category {
  id: number
  name: string
  slug: string
  group: string
  is_top_level: boolean
  parent: number | null
  children: Category[]
}

function NavbarContent() {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    let mounted = true
    api.get('/api/products/categories/')
      .then(res => {
        if (mounted) {
          setCategories(res.data)
        }
      })
      .catch(err => console.error("Failed to load categories", err))
    return () => { mounted = false }
  }, [])

  const { items } = useCart()

  // Group categories by their group field for mega menu
  const topLevelCategories = categories.filter((c: Category) => c.is_top_level || c.parent === null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Logo />

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search baby products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/" className="px-3 py-2 text-text hover:text-accent transition-colors font-medium">
              Home
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setIsCategoriesOpen(true)}
              onMouseLeave={() => setIsCategoriesOpen(false)}
            >
              <button className="px-3 py-2 text-text hover:text-accent transition-colors flex items-center gap-1 font-medium">
                Shop
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Mega Menu */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 top-full w-[700px] bg-white shadow-xl rounded-b-xl border-t-4 border-accent z-50 transition-all duration-200 ${
                  isCategoriesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                }`}
              >
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-6">
                    {topLevelCategories.slice(0, 8).map((groupCat: Category) => (
                      <div key={groupCat.id}>
                        <h4 className="font-bold text-accent border-b border-secondary pb-2 mb-3">{groupCat.name}</h4>
                        <ul className="space-y-2 text-sm">
                          {groupCat.children && groupCat.children.length > 0 ? (
                            groupCat.children.slice(0, 5).map((child: Category) => (
                              <li key={child.id}>
                                <Link href={`/?category=${child.slug}`} className="text-gray-600 hover:text-accent transition-colors block">
                                  {child.name}
                                </Link>
                              </li>
                            ))
                          ) : (
                            <li>
                              <Link href={`/?category=${groupCat.slug}`} className="text-gray-600 hover:text-accent transition-colors block">
                                View All
                              </Link>
                            </li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-secondary flex justify-between items-center">
                    <Link href="/categories" className="text-sm font-medium text-accent hover:text-accent/80">
                      View All Categories →
                    </Link>
                    <Link href="/categories" className="text-sm bg-secondary text-text px-4 py-2 rounded-full hover:bg-accent hover:text-white transition-colors">
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/account/orders" className="px-3 py-2 text-text hover:text-accent transition-colors font-medium">
              My Orders
            </Link>
            
            {/* Account Icon */}
            <Link href="/login" className="p-2 text-text hover:text-accent transition-colors hover:scale-110 inline-block" title="My Account">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            {/* Cart */}
            <button 
              onClick={() => setShowCart(s => !s)} 
              aria-label="Cart" 
              className="relative p-2 text-text hover:text-accent transition-colors hover:scale-110 inline-block"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {items.length}
                </span>
              )}
            </button>
            {showCart && (
              <div className="absolute right-4 top-16 z-50">
                <MiniCart items={items} />
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={() => setShowCart(s => !s)} 
              aria-label="Cart" 
              className="p-2 text-text"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            <button
              className="p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
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
            className="w-full pl-10 pr-4 py-2 border border-secondary rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </form>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              <Link href="/" className="px-3 py-2 text-text hover:text-accent font-medium" onClick={() => setIsOpen(false)}>
                Home
              </Link>
              <Link href="/categories" className="px-3 py-2 text-text hover:text-accent font-medium" onClick={() => setIsOpen(false)}>
                Categories
              </Link>
              <Link href="/login" className="px-3 py-2 text-text hover:text-accent font-medium" onClick={() => setIsOpen(false)}>
                My Account
              </Link>
              <Link href="/login" className="px-3 py-2 text-text hover:text-accent font-medium" onClick={() => setIsOpen(false)}>
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default NavbarContent
