"use client"
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import api from '../lib/api'
import { useCart } from '../lib/cartContext'
import { showToast } from '../components/Toast'
import ProductCard from '../components/ProductCard'
import SkeletonCard from '../components/ui/SkeletonCard'
import { Star, ArrowRight } from 'lucide-react'

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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeAgeGroup, setActiveAgeGroup] = useState(0)
  const { add } = useCart()

  const [banners, setBanners] = useState<Banner[]>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${apiUrl}/api/banners/`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data)
        }
      })
      .catch(() => {})
  }, [])

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
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">

      {/* Hero/Banner Section */}
      <section className="relative w-full bg-[var(--bg-secondary)] overflow-hidden" style={{ aspectRatio: '16/5' }}>
        <div className="absolute inset-0 z-0">
          {currentBanner?.image ? (
            <img
              key={currentBanner.id}
              src={currentBanner.image}
              alt={currentBanner.title || 'Malaika Nest Banner'}
              className={`w-full h-full object-cover object-center transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--pastel-pink)]/20 via-[var(--bg-secondary)] to-[var(--pastel-lavender)]/20">
              <div className="absolute top-10 right-32 w-72 h-72 rounded-full bg-[var(--accent)]/10 blur-3xl" />
              <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-[var(--purple)]/10 blur-3xl" />
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
                <p className="text-[var(--text-muted)] text-sm">No banner uploaded yet</p>
                <a href="/admin/banners" className="text-[var(--accent)] text-xs underline hover:text-[var(--accent-hover)]">
                  Upload a banner in admin →
                </a>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
        </div>

        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white text-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
              aria-label="Previous banner"
            >‹</button>
            <button
              onClick={goToNextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[var(--accent)]/80 hover:bg-[var(--accent)] backdrop-blur-sm text-white text-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
              aria-label="Next banner"
            >›</button>
          </>
        )}

        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
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
                className={`rounded-full transition-all duration-300 ${i === currentBannerIndex ? 'bg-[var(--accent)] w-6 h-2' : 'bg-white/40 hover:bg-white/70 w-2 h-2'}`}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Hero Content */}
      <section className="bg-[var(--bg-primary)] px-4 sm:px-8 lg:px-24 py-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[var(--pastel-pink)]/20 border border-[var(--pastel-pink)]/30 rounded-full px-4 py-1.5 mb-5">
            <span>🧸</span>
            <span className="text-[var(--accent)] text-sm font-medium">Premium Baby Products</span>
          </div>

          <h1 className="font-display font-bold text-[var(--text-primary)] leading-tight text-4xl sm:text-5xl lg:text-6xl mb-4">
            Everything Your<br />
            <span className="text-[var(--accent)]">Little One</span><br />
            Needs
          </h1>

          <p className="text-[var(--text-secondary)] text-base sm:text-lg leading-relaxed mb-6 max-w-lg">
            Shop trusted baby products, accessories and toys — delivered across Kenya. Pay instantly with M-Pesa.
          </p>

          <div className="flex items-center gap-4 mb-6">
            <Link href="/categories" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-8 py-3 rounded-[12px] transition-all duration-200 hover:shadow-[var(--shadow-accent)]">
              Shop Now
            </Link>
            <Link href="/#categories" className="border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 px-8 py-3 rounded-[12px] font-semibold transition-all duration-200">
              View Categories
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
              <span className="text-green-500">✓</span> M-Pesa Secure
            </span>
            <span className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
              <span className="text-green-500">✓</span> Free Shipping over KES 5,000
            </span>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-[var(--bg-secondary)]" id="categories">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "'Playfair Display', serif" }}>Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/?category=${cat.slug}`}
                className="group bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] rounded-[20px] p-6 text-center transition-all duration-300 hover:-translate-y-1 border border-[var(--border)] hover:border-[var(--accent)]"
              >
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Age Groups Section */}
      <section className="py-16 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] text-center mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            Browse Different Types of Toys for Different Ages
          </h2>

          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            {ageGroups.map((age, idx) => (
              <button
                key={age.slug}
                onClick={() => setActiveAgeGroup(idx)}
                className={`px-6 py-3 rounded-[12px] font-medium transition-all ${activeAgeGroup === idx
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
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
            <Link href="/categories" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-[12px] transition-colors">
              See More Toys
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "'Playfair Display', serif" }}>Featured Toys</h2>
              <p className="text-[var(--text-secondary)] mt-1">Handpicked for your little ones</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-[12px] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">←</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all">→</button>
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

      {/* Testimonials Section */}
      <section className="py-16 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] text-center mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            Happy Parents Love Malaika Nest
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-[var(--bg-card)] rounded-[20px] p-6 border border-[var(--border)] hover:border-[var(--accent)] transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[var(--pastel-pink)]/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--text-primary)]">{testimonial.name}</h4>
                    <p className="text-[var(--accent)] text-xs">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-4 h-4 ${star <= testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--text-muted)]'}`} />
                  ))}
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 sm:px-8 lg:px-24 bg-[var(--bg-primary)] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--pastel-pink)/20 0%, var(--bg-primary) 100%)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--pastel-lavender)]/10 to-transparent"></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[var(--accent)] rounded-full flex items-center justify-center">
              <span className="text-3xl text-white">📧</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Subscribe to Our Newsletter
          </h2>
          <p className="text-[var(--text-secondary)] text-base mt-2 mb-6">Get the latest baby product deals and updates</p>

          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 h-14 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-[12px] px-5 focus:border-[var(--accent)] focus:outline-none w-full sm:max-w-md"
              required
            />
            <button
              type="submit"
              className="h-14 px-8 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-[12px] transition-all duration-200 whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

