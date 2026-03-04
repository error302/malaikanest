"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '../lib/api'
import { useCart } from '../lib/cartContext'
import { showToast } from '../components/Toast'
import ProductCard from '../components/ProductCard'
import SkeletonCard from '../components/ui/SkeletonCard'
import SectionHeader from '../components/ui/SectionHeader'
import { Search, ChevronLeft, ChevronRight, Play, Star, ArrowRight } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
  image: string | null
}

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
 
// Demo products for when API is not available
const DEMO_PRODUCTS: Product[] = [
  { id: 1, name: 'Premium Baby Blanket', slug: 'baby-blanket', price: '2500', image: null, category: { name: 'Baby Clothing' }, seller: { name: 'Kenya Baby' }, is_new: true, rating: 5, reviews_count: 12, stock: 25 },
  { id: 2, name: 'Soft Cotton Onesies Pack', slug: 'onesies-pack', price: '1500', image: null, category: { name: 'Baby Clothing' }, seller: { name: 'Kenya Baby' }, rating: 4, reviews_count: 8, stock: 50 },
  { id: 3, name: 'Baby Diapers (Pack of 30)', slug: 'baby-diapers', price: '1800', image: null, category: { name: 'Diapers' }, seller: { name: 'Kenya Baby' }, is_new: true, rating: 5, reviews_count: 25, stock: 100 },
  { id: 4, name: 'Baby Bottle Set', slug: 'bottle-set', price: '2200', image: null, category: { name: 'Feeding' }, seller: { name: 'Kenya Baby' }, rating: 4, reviews_count: 15, stock: 0 },
  { id: 5, name: 'Educational Toys Set', slug: 'edu-toys', price: '3500', image: null, category: { name: 'Toys' }, seller: { name: 'Kenya Baby' }, rating: 5, reviews_count: 30, stock: 15 },
  { id: 6, name: 'Baby Stroller', slug: 'baby-stroller', price: '15000', image: null, category: { name: 'Gear' }, seller: { name: 'Kenya Baby' }, is_new: true, rating: 4, reviews_count: 5, stock: 8 },
  { id: 7, name: 'Baby Walker', slug: 'baby-walker', price: '4500', image: null, category: { name: 'Gear' }, seller: { name: 'Kenya Baby' }, rating: 4, reviews_count: 18, stock: 0 },
  { id: 8, name: 'Nursing Pillow', slug: 'nursing-pillow', price: '2800', image: null, category: { name: 'Feeding' }, seller: { name: 'Kenya Baby' }, rating: 5, reviews_count: 22, stock: 12 },
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

const heroProducts = [
  { id: 1, name: 'Premium Baby Bundle Set', price: '4500', image: null },
  { id: 2, name: 'Soft Plush Teddy Bear', price: '1200', image: null },
  { id: 3, name: 'Educational Building Blocks', price: '2800', image: null },
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
  const [currentHeroProduct, setCurrentHeroProduct] = useState(0)
  const [activeAgeGroup, setActiveAgeGroup] = useState(0)
  const { add } = useCart()

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

  // Auto-rotate hero product
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroProduct((prev) => (prev + 1) % heroProducts.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

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
    <div className="min-h-screen bg-bg-primary">
      {/* Demo Mode Banner - Only show in development */}
      {process.env.NODE_ENV === 'development' && demoMode && (
        <div className="bg-yellow-600/90 text-yellow-100 text-center py-2 text-sm font-medium sticky top-16 z-40">
          Demo Mode - Showing sample products. Connect backend API to see real data.
        </div>
      )}

      {/* Hero Section - Two Column Layout */}
      <section className="relative min-h-[85vh] flex items-center bg-bg-primary hero-gradient pt-16">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="order-2 lg:order-1">
              {/* Floating Badge */}
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full mb-6">
                <span className="text-xl">🧸</span>
                <span className="text-sm font-medium">Brain Growth Toys</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold font-display text-white leading-tight mb-6">
                Products That Help Brain Growth for your Children
              </h1>
              
              <p className="text-text-muted text-lg mb-8 max-w-lg">
                Choose to pay monthly or prepay for 3, 6, or 12 to 48 months 
                in advance for discounts!
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="w-full max-w-lg mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Baby Products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 bg-bg-card border border-border-dark rounded-[14px] text-white placeholder-text-muted pl-5 pr-32 focus:outline-none focus:border-accent transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 bg-accent hover:bg-accent-hover text-white px-5 rounded-[10px] transition-colors flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                </div>
              </form>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 text-text-muted text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> M-Pesa Secure
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Free Shipping over KES 5,000
                </div>
              </div>
            </div>

            {/* Right Column - Featured Product Carousel */}
            <div className="order-1 lg:order-2">
              <div className="relative bg-bg-card rounded-[24px] p-8 md:p-12 border border-border-dark">
                {/* Navigation Arrows */}
                <button 
                  onClick={() => setCurrentHeroProduct((prev) => (prev - 1 + heroProducts.length) % heroProducts.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-btn border border-border-dark text-white hover:border-accent hover:text-accent transition-all z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentHeroProduct((prev) => (prev + 1) % heroProducts.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-btn bg-accent text-white hover:bg-accent-hover transition-all z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Product Display */}
                <div className="text-center">
                  <div className="w-64 h-64 mx-auto mb-6 bg-bg-card-hover rounded-full flex items-center justify-center animate-float">
                    <span className="text-8xl">
                      {heroProducts[currentHeroProduct].image || '🧸'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1">
                    {heroProducts[currentHeroProduct].name}
                  </h3>
                  <p className="text-text-muted text-sm mb-4">by Kenya Baby</p>
                  
                  <p className="text-3xl font-bold text-white mb-6">
                    KES {parseFloat(heroProducts[currentHeroProduct].price).toLocaleString()}
                  </p>

                  <button 
                    onClick={(e) => {
                      const product = DEMO_PRODUCTS[0]
                      handleAddToCart(e, product)
                    }}
                    className="w-14 h-14 mx-auto flex items-center justify-center bg-bg-card border border-border-dark rounded-btn text-white hover:bg-accent hover:border-accent transition-all"
                  >
                    <span className="text-xl">🛒</span>
                  </button>
                </div>

                {/* Floating Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '0.5s' }}>
                  <span className="text-2xl">✈️</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                  <span className="text-2xl">🧸</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category - bg: #252538 */}
      <section className="py-16 bg-bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader 
            title="Shop by Category" 
            showArrows={false}
            className="mb-8"
          />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {categories.map((cat, idx) => (
              <Link
                key={cat.slug}
                href={`/?category=${cat.slug}`}
                className="group bg-bg-primary hover:bg-bg-card-hover rounded-card p-6 text-center transition-all duration-300 hover:-translate-y-1 border border-border-dark hover:border-accent"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <h3 className="font-semibold text-white group-hover:text-accent transition-colors">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - bg: #1C1C2E */}
      <section className="py-16 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Steps */}
            <div>
              <SectionHeader title="How It Works" showArrows={false} className="mb-8" />
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-xl flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Find a Toy</h4>
                    <p className="text-text-muted text-sm">Browse our wide selection of safe, quality baby products</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-xl flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Choose & Order</h4>
                    <p className="text-text-muted text-sm">Select your products and add to cart</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-xl flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Make Payment</h4>
                    <p className="text-text-muted text-sm">Pay securely with M-Pesa and get it delivered</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Card */}
            <div className="relative">
              <div className="bg-bg-card-hover rounded-card overflow-hidden border border-border-dark">
                <div className="aspect-video bg-gradient-to-br from-accent/20 to-bg-primary flex items-center justify-center">
                  <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              </div>
              <p className="text-center text-text-muted text-sm mt-3">Play Video</p>
            </div>
          </div>
        </div>
      </section>

      {/* Age-Based Browse Section - bg: #1A1A2E */}
      <section className="py-16 bg-bg-section">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold font-display text-white text-center mb-8">
            Browse Different Types of Toys for Different Ages
          </h2>

          {/* Age Tabs */}
          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            {ageGroups.map((age, idx) => (
              <button
                key={age.slug}
                onClick={() => setActiveAgeGroup(idx)}
                className={`px-6 py-3 rounded-btn font-medium transition-all ${
                  activeAgeGroup === idx 
                    ? 'bg-accent text-white' 
                    : 'bg-bg-card text-text-muted hover:text-white border border-border-dark'
                }`}
              >
                {age.emoji} {age.name}
              </button>
            ))}
          </div>

          {/* Products for Age Group */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
            ) : (
              products.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>

          {/* See More Button */}
          <div className="text-center mt-8">
            <Link href="/categories" className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-btn transition-colors">
              See More Toys
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Toys Section - bg: #252538 */}
      <section className="py-16 bg-bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader 
            title="Featured Toys" 
            subtitle="Handpicked for your little ones"
            onLeftClick={() => {}}
            onRightClick={() => {}}
          />
          
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

      {/* Top Rated Sellers - bg: #1C1C2E */}
      <section className="py-16 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader title="Top Rated Sellers of the Month" showArrows={false} className="mb-8" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((seller) => (
              <div key={seller} className="bg-bg-card rounded-card p-5 border border-border-dark text-center hover:border-accent transition-all">
                <div className="w-16 h-16 bg-purple/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🏪</span>
                </div>
                <h4 className="font-semibold text-white mb-1">Seller {seller}</h4>
                <div className="flex items-center justify-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-3 h-3 text-star fill-star" />
                  ))}
                </div>
                <p className="text-text-muted text-xs">{50 + seller * 10} sales</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Logos Bar - bg: #252538 */}
      <section className="py-8 bg-bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 hover:opacity-70 transition-opacity">
            {brands.map((brand) => (
              <span key={brand} className="text-lg md:text-xl font-bold text-text-muted hover:text-white transition-colors">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - bg: #1C1C2E */}
      <section className="py-16 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader 
            title="Satisfied People from Malaika Nest" 
            showArrows={false}
            className="mb-8"
          />
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-bg-card rounded-card p-6 border border-border-dark hover:border-accent transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-accent text-xs">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-4 h-4 ${star <= testimonial.rating ? 'text-star fill-star' : 'text-text-muted'}`} />
                  ))}
                </div>
                <p className="text-text-muted text-sm leading-relaxed italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section - purple gradient */}
      <section className="py-16 bg-gradient-to-r from-[#2D1B4E] to-bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple/10 to-transparent"></div>
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple rounded-full flex items-center justify-center">
              <span className="text-3xl text-white">📧</span>
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-display text-white mb-4">
            Subscribe Newsletter
          </h2>
          <p className="text-text-muted mb-6">Get the latest baby product deals and updates</p>
          
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 h-12 bg-bg-card border border-border-dark rounded-input text-white placeholder-text-muted px-4 focus:outline-none focus:border-accent"
              required
            />
            <button
              type="submit"
              className="px-8 h-12 bg-purple hover:bg-purple-hover text-white font-medium rounded-btn transition-colors shadow-purple whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

