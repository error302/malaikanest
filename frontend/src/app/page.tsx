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
    <div className="min-h-screen bg-[#1C1C2E]">

      <section className="relative w-full bg-[#1C1C2E] overflow-hidden" style={{ aspectRatio: '16/5' }}>
        <div className="absolute inset-0 z-0">
          {currentBanner?.image ? (
            <img
              key={currentBanner.id}
              src={currentBanner.image}
              alt={currentBanner.title || 'Malaika Nest Banner'}
              className={`w-full h-full object-cover object-center transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#2D1B4E] via-[#1C1C2E] to-[#1A1A2E]">
              <div className="absolute top-10 right-32 w-72 h-72 rounded-full bg-[#C8963E]/10 blur-3xl" />
              <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-[#7B2FBE]/10 blur-3xl" />
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
                <p className="text-[#3A3A55] text-sm">No banner uploaded yet</p>
                <a href="/admin/banners/banner/add/" className="text-[#C8963E] text-xs underline hover:text-[#E0A83F]">
                  Upload a banner in admin →
                </a>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1C1C2E] to-transparent" />
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
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#C8963E]/80 hover:bg-[#C8963E] backdrop-blur-sm text-white text-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
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
                className={`rounded-full transition-all duration-300 ${i === currentBannerIndex ? 'bg-[#C8963E] w-6 h-2' : 'bg-white/40 hover:bg-white/70 w-2 h-2'}`}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="bg-[#1C1C2E] px-4 sm:px-8 lg:px-24 py-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[#C8963E]/15 border border-[#C8963E]/30 rounded-full px-4 py-1.5 mb-5">
            <span>🧸</span>
            <span className="text-[#C8963E] text-sm font-medium">Premium Baby Products</span>
          </div>

          <h1 className="font-display font-bold text-white leading-tight text-4xl sm:text-5xl lg:text-6xl mb-4">
            Everything Your<br />
            <span className="text-[#C8963E]">Little One</span><br />
            Needs
          </h1>

          <p className="text-[#A0A0B8] text-base sm:text-lg leading-relaxed mb-6 max-w-lg">
            Shop trusted baby products, accessories and toys — delivered across Kenya. Pay instantly with M-Pesa.
          </p>

          <div className="flex items-center gap-4 mb-6">
            <Link href="/categories" className="bg-[#C8963E] hover:bg-[#E0A83F] text-white font-semibold px-8 py-3 rounded-[12px] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(200,150,62,0.4)]">
              Shop Now
            </Link>
            <Link href="/#categories" className="border border-[#C8963E] text-[#C8963E] hover:bg-[#C8963E]/10 px-8 py-3 rounded-[12px] font-semibold transition-all duration-200">
              View Categories
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-[#A0A0B8] text-sm">
              <span className="text-green-400">✓</span> M-Pesa Secure
            </span>
            <span className="flex items-center gap-2 text-[#A0A0B8] text-sm">
              <span className="text-green-400">✓</span> Free Shipping over KES 5,000
            </span>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#252538]" id="categories">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {categories.map((cat) => (
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
                className={`px-6 py-3 rounded-[12px] font-medium transition-all ${activeAgeGroup === idx
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

      <section className="py-16 bg-[#252538]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Featured Toys</h2>
              <p className="text-[#A0A0B8] mt-1">Handpicked for your little ones</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-[12px] border border-[#3A3A55] text-white hover:border-[#C8963E] hover:text-[#C8963E] transition-all">←</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-[#C8963E] text-white hover:bg-[#E0A83F] transition-all">→</button>
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
