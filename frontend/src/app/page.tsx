"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '../lib/api'
import { useCart } from '../lib/cartContext'
import { showToast } from '../components/Toast'
import ProductCard from '../components/ProductCard'
import SkeletonCard from '../components/ui/SkeletonCard'
import SectionHeader from '../components/ui/SectionHeader'
import { Search, ChevronLeft, ChevronRight, Star, ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen bg-[#1C1C2E]">
      {/* Demo Mode Banner - Only show in development */}
      {process.env.NODE_ENV === 'development' && demoMode && (
        <div className="bg-yellow-600/90 text-yellow-100 text-center py-2 text-sm font-medium sticky top-16 z-40">
          Demo Mode - Showing sample products. Connect backend API to see real data.
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center bg-[#1C1C2E] pt-16">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-[#C8963E]/20 text-[#C8963E] px-4 py-2 rounded-full mb-6">
                <span className="text-xl">🧸</span>
                <span className="text-sm font-medium">Brain Growth Toys</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-white leading-tight mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Products That Help Brain Growth for your Children
              </h1>
              
              <p className="text-[#A0A0B8] text-lg mb-8 max-w-lg">
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
                    className="w-full h-14 bg-[#252538] border border-[#3A3A55] rounded-[14px] text-white placeholder-[#A0A0B8] pl-5 pr-32 focus:outline-none focus:border-[#C8963E] transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 bg-[#C8963E] hover:bg-[#E0A83F] text-white px-5 rounded-[10px] transition-colors flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-6 text-[#A0A0B8] text-sm">
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
              <div className="relative bg-[#252538] rounded-[24px] p-8 md:p-12 border border-[#3A3A55]">
                <button 
                  onClick={() => setCurrentHeroProduct((prev) => (prev - 1 + heroProducts.length) % heroProducts.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-[12px] border border-[#3A3A55] text-white hover:border-[#C8963E] hover:text-[#C8963E] transition-all z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentHeroProduct((prev) => (prev + 1) % heroProducts.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-[12px] bg-[#C8963E] text-white hover:bg-[#E0A83F] transition-all z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <div className="w-64 h-64 mx-auto mb-6 bg-[#2D2D45] rounded-full flex items-center justify-center animate-float">
                    <span className="text-8xl">
                      {heroProducts[currentHeroProduct].image || '🧸'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1">
                    {heroProducts[currentHeroProduct].name}
                  </h3>
                  <p className="text-[#A0A0B8] text-sm mb-4">by Malaika Nest</p>
                  
                  <p className="text-3xl font-bold text-white mb-6">
                    KES {parseFloat(heroProducts[currentHeroProduct].price).toLocaleString()}
                  </p>

                  <button 
                    onClick={(e) => {
                      const product = DEMO_PRODUCTS[0]
                      handleAddToCart(e, product)
                    }}
                    className="w-14 h-14 mx-auto flex items-center justify-center bg-[#252538] border border-[#3A3A55] rounded-[12px] text-white hover:bg-[#C8963E] hover:border-[#C8963E] transition-all"
                  >
                    <span className="text-xl">🛒</span>
                  </button>
                </div>

                <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#C8963E]/20 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '0.5s' }}>
                  <span className="text-2xl">✈️</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-[#C8963E]/20 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                  <span className="text-2xl">🧸</span>
                </div>
              </div>
            </div>
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

