"use client"
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import api from '../lib/api'
import { useCart } from '../lib/cartContext'
import { showToast } from '../components/Toast'
import ProductCard from '../components/ProductCard'
import SkeletonCard from '../components/ui/SkeletonCard'
import { Search, Star, ArrowRight } from 'lucide-react'

interface Product {
  id: number
  name: string
  slug: string
  price: string
  image: string | null
  category: { name: string }
  images?: string[]
  seller?: { name: string }
  is_new?: boolean
  rating?: number
  reviews_count?: number
  stock?: number
}

interface Banner {
  id: number
  title: string
  subtitle: string
  button_text: string
  button_link: string
  image: string
  is_active: boolean
  position: number
}
 
// Demo products for when API is not available
const DEMO_PRODUCTS: Product[] = [
  { id: 1, name: 'Premium Baby Blanket', slug: 'baby-blanket', price: '2500', image: null, category: { name: 'Baby Clothing' }, seller: { name: 'Malaika Nest' }, is_new: true, rating: 5, reviews_count: 12, stock: 25 },
  { id: 2, name: 'Soft Cotton Onesies Pack', slug: 'onesies-pack', price: '1500', image: null, category: { name: 'Baby Clothing' }, seller: { name: 'Malaika Nest' }, rating: 4, reviews_count: 8, stock: 50 },
  { id: 3, name: 'Baby Diapers (Pack of 30)', slug: 'baby-diapers', price: '1800', image: null, category: { name: 'Diapers' }, seller: { name: 'Malaika Nest' }, is_new: true, rating: 5, reviews_count: 25, stock: 100 },
  { id: 4, name: 'Baby Bottle Set', slug: 'bottle-set', price: '2200', image: null, category: { name: 'Feeding' }, seller: { name: 'Malaika Nest' }, rating: 4, reviews_count: 15, stock: 0 },
  { id: 5, name: 'Educational Toys Set', slug: 'edu-toys', price: '3500', image: null, category: { name: 'Toys' }, seller: { name: 'Malaika Nest' }, rating: 5, reviews_count: 30, stock: 15 },
  { id: 6, name: 'Baby Stroller', slug: 'baby-stroller', price: '15000', image: null, category: { name: 'Gear' }, seller: { name: 'Malaika Nest' }, is_new: true, rating: 4, reviews_count: 5, stock: 8 },
  { id: 7, name: 'Baby Walker', slug: 'baby-walker', price: '4500', image: null, category: { name: 'Gear' }, seller: { name: 'Malaika Nest' }, rating: 4, reviews_count: 18, stock: 0 },
  { id: 8, name: 'Nursing Pillow', slug: 'nursing-pillow', price: '2800', image: null, category: { name: 'Feeding' }, seller: { name: 'Malaika Nest' }, rating: 5, reviews_count: 22, stock: 12 },
]
 
const categories = [
  { name: 'Baby Clothing', slug: 'clothing-apparel', emoji: '👶' },
  { name: 'Accessories', slug: 'baby-accessories', emoji: '🎀' },
  { name: 'Feeding', slug: 'feeding-nursing', emoji: '🍼' },
  { name: 'Toys', slug: 'toys-learning', emoji: '🧸' },
  { name: 'Nursery', slug: 'nursery', emoji: '🛏️' },
]

const ageGroups = [
  { name: '0-1 Years', slug: '0-1-years', emoji: '👼' },
  { name: '2-3 Years', slug: '2-3-years', emoji: '🧒' },
  { name: '4-6 Years', slug: '4-6-years', emoji: '👦' },
]

const testimonials = [
  { name: 'Grace W.', location: 'Nairobi', rating: 5, text: 'Malaika Nest delivered in 2 days! The baby clothes are exactly as described and the M-Pesa payment was instant.', avatar: '👩' },
  { name: 'Peter K.', location: 'Mombasa', rating: 5, text: 'Best baby store online in Kenya. Great quality and fair prices.', avatar: '👨' },
  { name: 'Aisha M.', location: 'Kisumu', rating: 5, text: 'The nursing pillow I ordered is amazing. Highly recommend Malaika Nest to all new mums in Kenya!', avatar: '👩‍🦰' },
]

// Kenyan media brands
const brands = ['Nation Media', 'Standard Group', 'Citizen TV', 'Nairobi News', 'Tuko.co.ke']

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [demoMode, setDemoMode] = useState(false)
  const [activeAgeGroup, setActiveAgeGroup] = useState(0)
  const { add } = useCart()

  // Banner state for dynamic hero
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [bannersLoaded, setBannersLoaded] = useState(false)

  // Fetch banners on mount
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${apiUrl}/api/banners/`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data)
        }
        setBannersLoaded(true)
      })
      .catch(() => setBannersLoaded(true))
  }, [])

  // Auto-rotate banners
  const goToNextBanner = useCallback(() => {
    if (banners.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentBannerIndex(i => (i + 1) % banners.length)
      setIsTransitioning(false)
    }, 300)
  }, [banners.length])

  const goToPrevBanner = useCallback(() => {
    if (banners.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentBannerIndex(i => (i - 1 + banners.length) % banners.length)
      setIsTransitioning(false)
    }, 300)
  }, [banners.length])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(goToNextBanner, 5000)
    return () => clearInterval(timer)
  }, [banners.length, goToNextBanner])

  const currentBanner = banners[currentBannerIndex] || null

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await add({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.image || '',
        qty: 1
      })
      showToast(`${product.name} added to cart!`, 'success')
    } catch (error) {
      console.error('Failed to add to cart:', error)
      showToast('Failed to add to cart. Please try again.', 'error')
    }
  }

  useEffect(() => {
    api.get('/api/products/products/')
      .then(res => {
        setProducts(res.data.slice(0, 8))
        setDemoMode(false)
      })
      .catch(() => {
        setProducts(DEMO_PRODUCTS)
        setDemoMode(true)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <div className="min-h-screen bg-[#1C1C2E]">
      {/* Demo Mode Banner - Only show in development */}
      {process.env.NODE_ENV === 'development' && demoMode && (
        <div className="bg-yellow-600/90 text-yellow-100 text-center py-2 text-sm font-medium sticky top-16 z-40">
          Demo Mode - Showing sample products. Connect backend API to see real data.
        </div>
      )}

      {/* Hero Section - Full Banner Layout */}
      <section className="relative w-full min-h-[90vh] bg-[#1C1C2E] overflow-hidden flex items-center">
        {/* Background banner image */}
        <div className="absolute inset-0 z-0">
          {/* Dynamic banner image — fades between banners */}
          {currentBanner?.image ? (
            <img
              key={currentBanner.id}
              src={currentBanner.image}
              alt={currentBanner.title || 'Malaika Nest Banner'}
              className={`
                w-full h-full object-cover object-center
                transition-opacity duration-500
                ${isTransitioning ? 'opacity-0' : 'opacity-100'}
              `}
            />
          ) : (
            // Fallback when no banners uploaded yet
            // Beautiful dark gradient — site looks good even before any banners are uploaded
            <div className="
              w-full h-full
              bg-gradient-to-br 
              from-[#2D1B4E] via-[#1C1C2E] to-[#1A1A2E]
            ">
              {/* Decorative circles */}
              <div className="
                absolute top-20 right-40
                w-64 h-64 rounded-full
                bg-[#C8963E]/10 blur-3xl
              " />
              <div className="
                absolute bottom-20 right-20
                w-48 h-48 rounded-full
                bg-[#7B2FBE]/10 blur-3xl
              " />
            </div>
          )}

          {/* Dark gradient overlay — always present */}
          {/* Makes text readable over ANY banner image */}
          <div className="
            absolute inset-0
            bg-gradient-to-r
            from-[#1C1C2E] 
            via-[#1C1C2E]/75
            to-[#1C1C2E]/20
          " />
          {/* Bottom fade into next section */}
          <div className="
            absolute bottom-0 left-0 right-0 h-24
            bg-gradient-to-t from-[#1C1C2E] to-transparent
          " />
        </div>

        {/* Arrow navigation - only visible if 2+ banners */}
        {banners.length > 1 && (
          <>
            {/* Left arrow */}
            <button
              onClick={goToPrevBanner}
              className="
                absolute left-4 top-1/2 -translate-y-1/2 z-20
                w-10 h-10 rounded-full
                bg-black/30 hover:bg-black/60
                backdrop-blur-sm
                flex items-center justify-center
                text-white text-lg
                transition-all duration-200
                hover:scale-110
              "
              aria-label="Previous banner"
            >
              ‹
            </button>

            {/* Right arrow */}
            <button
              onClick={goToNextBanner}
              className="
                absolute right-4 top-1/2 -translate-y-1/2 z-20
                w-10 h-10 rounded-full
                bg-[#C8963E]/80 hover:bg-[#C8963E]
                backdrop-blur-sm
                flex items-center justify-center
                text-white text-lg
                transition-all duration-200
                hover:scale-110
              "
              aria-label="Next banner"
            >
              ›
            </button>
          </>
        )}

        {/* Dot navigation - only if 2+ banners */}
        {banners.length > 1 && (
          <div className="
            absolute bottom-8 left-1/2 -translate-x-1/2 z-20
            flex items-center gap-2
          ">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsTransitioning(true)
                  setTimeout(() => {
                    setCurrentBannerIndex(i)
                    setIsTransitioning(false)
                  }, 300)
                }}
                className={`
                  rounded-full transition-all duration-300
                  ${i === currentBannerIndex
                    ? 'bg-[#C8963E] w-6 h-2'
                    : 'bg-white/40 hover:bg-white/70 w-2 h-2'
                  }
                `}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Content overlay — left aligned */}
        <div className="relative z-10 px-4 sm:px-8 lg:px-24 max-w-2xl py-20">
          {/* Top badge - hide if banner has custom content */}
          {!currentBanner?.title && (
            <div className="inline-flex items-center gap-2 bg-[#C8963E]/20 border border-[#C8963E]/40 rounded-full px-4 py-2 mb-6">
              <span>🧸</span>
              <span className="text-[#C8963E] text-sm font-medium">
                Premium Baby Products
              </span>
            </div>
          )}

          {/* Main heading - use banner title if set, else default */}
          <h1 className="font-bold text-white leading-tight text-4xl sm:text-5xl lg:text-6xl mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {currentBanner?.title ? (
              currentBanner.title
            ) : (
              <>
                Everything Your<br />
                <span className="text-[#C8963E]">Little One</span><br />
                Needs
              </>
            )}
          </h1>

          {/* Subtext - use banner subtitle if set */}
          <p className="text-[#A0A0B8] text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
            {currentBanner?.subtitle || 
             'Shop trusted baby products, accessories and toys — delivered across Kenya. Pay instantly with M-Pesa.'}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex items-center bg-[#252538] border border-[#3A3A55] rounded-[14px] overflow-hidden max-w-lg h-14 focus-within:border-[#C8963E] transition-colors duration-200">
            <input
              type="text"
              placeholder="Search baby products, toys & accessories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-[#A0A0B8] px-5 text-sm outline-none"
            />
            <button type="submit" className="bg-[#C8963E] hover:bg-[#E0A83F] text-white font-semibold text-sm px-6 h-full flex items-center gap-2 transition-colors duration-200 shrink-0">
              🔍 Search
            </button>
          </form>

          {/* Trust pills */}
          <div className="flex items-center gap-6 mt-6 flex-wrap">
            <span className="flex items-center gap-2 text-[#A0A0B8] text-sm">
              <span className="text-green-400">✓</span> M-Pesa Secure
            </span>
            <span className="flex items-center gap-2 text-[#A0A0B8] text-sm">
              <span className="text-green-400">✓</span> Free Shipping over KES 5,000
            </span>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 bg-[#252538]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {categories.map((cat, idx) => (
              <Link
                key={cat.slug}
                href={`/?category=${cat.slug}`}
                className="group bg-[#1C1C2E] hover:bg-[#2D2D45] rounded-[20px] p-6 text-center transition-all duration-300 hover:-translate-y-1 border border-[#3A3A55] hover:border-[#C8963E]"
              >
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <h3 className="font-semibold text-white group-hover:text-[#C8963E] transition-colors">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Age-Based Browse Section */}
      <section className="py-16 bg-[#1A1A2E]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Browse Different Types of Toys for Different Ages
          </h2>

          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            {ageGroups.map((age, idx) => (
              <button
                key={age.slug}
                onClick={() => setActiveAgeGroup(idx)}
                className={`px-6 py-3 rounded-[12px] font-medium transition-all ${
                  activeAgeGroup === idx 
                    ? 'bg-[#C8963E] text-white' 
                    : 'bg-[#252538] text-[#A0A0B8] hover:text-white border border-[#3A3A55]'
                }`}
              >
                {age.emoji} {age.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
            ) : (
              products.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>

          <div className="text-center mt-8">
            <Link href="/categories" className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8963E] hover:bg-[#E0A83F] text-white rounded-[12px] transition-colors">
              See More Toys
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Toys Section */}
      <section className="py-16 bg-[#252538]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Featured Toys</h2>
              <p className="text-[#A0A0B8] mt-1">Handpicked for your little ones</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-[12px] border border-[#3A3A55] text-white hover:border-[#C8963E] hover:text-[#C8963E] transition-all">
                ←
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-[#C8963E] text-white hover:bg-[#E0A83F] transition-all">
                →
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brand Logos Bar */}
      <section className="py-8 bg-[#252538]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 hover:opacity-70 transition-opacity">
            {brands.map((brand) => (
              <span key={brand} className="text-lg md:text-xl font-bold text-[#A0A0B8] hover:text-white transition-colors">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-[#1C1C2E]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Satisfied People from Malaika Nest
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-[#252538] rounded-[20px] p-6 border border-[#3A3A55] hover:border-[#C8963E] transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#7B2FBE]/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-[#C8963E] text-xs">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-4 h-4 ${star <= testimonial.rating ? 'text-[#FFB800] fill-[#FFB800]' : 'text-[#A0A0B8]'}`} />
                  ))}
                </div>
                <p className="text-[#A0A0B8] text-sm leading-relaxed italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 sm:px-8 lg:px-24 bg-[#1C1C2E] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #1C1C2E 100%)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#7B2FBE]/10 to-transparent"></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#C8963E] rounded-full flex items-center justify-center">
              <span className="text-3xl text-white">📧</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Subscribe Newsletter
          </h2>
          <p className="text-[#A0A0B8] text-base mt-2 mb-6">Get the latest baby product deals and updates</p>
          
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 h-14 bg-[#1C1C2E] border border-[#3A3A55] text-white placeholder-[#A0A0B8] rounded-[12px] px-5 focus:border-[#C8963E] focus:outline-none w-full sm:max-w-md"
              required
            />
            <button
              type="submit"
              className="h-14 px-8 bg-[#C8963E] hover:bg-[#E0A83F] text-white font-semibold rounded-[12px] transition-all duration-200 whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

