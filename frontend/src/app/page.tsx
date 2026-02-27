"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import api, { IS_DEMO_MODE } from '../lib/api'

interface Category {
  id: number
  name: string
  slug: string
  image: string | null
}

interface Product {
  id: number
  name: string
  price: string
  image: string | null
  category: { name: string }
}

// Demo products for when API is not available
const DEMO_PRODUCTS: Product[] = [
  { id: 1, name: 'Premium Baby Blanket', price: '2500', image: null, category: { name: 'Baby Clothing' } },
  { id: 2, name: 'Soft Cotton Onesies Pack', price: '1500', image: null, category: { name: 'Baby Clothing' } },
  { id: 3, name: 'Baby Diapers (Pack of 30)', price: '1800', image: null, category: { name: 'Diapers' } },
  { id: 4, name: 'Baby Bottle Set', price: '2200', image: null, category: { name: 'Feeding' } },
  { id: 5, name: 'Educational Toys Set', price: '3500', image: null, category: { name: 'Toys' } },
  { id: 6, name: 'Baby Stroller', price: '15000', image: null, category: { name: 'Gear' } },
]

const categories = [
  { name: 'Baby Clothing', slug: 'clothing-apparel', emoji: '👶' },
  { name: 'Accessories', slug: 'baby-accessories', emoji: '🎀' },
  { name: 'Feeding', slug: 'feeding-nursing', emoji: '🍼' },
  { name: 'Toys', slug: 'toys-learning', emoji: '🧸' },
  { name: 'Newborn Essentials', slug: 'newborn-0-3-months', emoji: '🌸' },
]

const ageGroups = [
  { name: '0-3 Months', slug: 'newborn-0-3-months', color: 'bg-secondary' },
  { name: '3-6 Months', slug: 'infant-3-6-months', color: 'bg-secondary/80' },
  { name: '6-12 Months', slug: 'infant-6-12-months', color: 'bg-secondary/60' },
  { name: '1-3 Years', slug: 'toddler-1-3-years', color: 'bg-secondary/40' },
]

const slides = [
  {
    title: 'Nurture with Love',
    subtitle: 'Safe Baby Essentials for Your Little One',
    description: 'Curated, affordable, and safe products for your baby. Shop with confidence using secure M-Pesa payments.',
    cta: 'Shop Now',
    ctaLink: '/',
    bg: 'from-secondary via-primary to-white',
  },
  {
    title: 'New Arrivals',
    subtitle: 'Fresh Picks for Your Baby',
    description: 'Discover our latest collection of premium baby products.',
    cta: 'Explore',
    ctaLink: '/categories',
    bg: 'from-secondary via-white to-white',
  },
  {
    title: 'Flat 20% Off',
    subtitle: 'On All Newborn Essentials',
    description: 'Limited time offer on premium baby care products.',
    cta: 'Grab Deal',
    ctaLink: '/?category=newborn-0-3-months',
    bg: 'from-accent via-secondary to-white',
  },
]

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
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
        // Use demo data if API fails
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
    <div className="min-h-screen">
      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="bg-yellow-500 text-yellow-900 text-center py-2 text-sm font-medium">
          Demo Mode - Showing sample products. Connect backend API to see real data.
        </div>
      )}
      
      {/* Hero Slider */}
      <section className="relative overflow-hidden">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`transition-all duration-700 ease-in-out ${
              idx === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 absolute inset-0 translate-x-full'
            }`}
          >
            <div className={`bg-gradient-to-br ${slide.bg} py-16 md:py-24 lg:py-32`}>
              <div className="max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <p className="text-accent font-medium mb-2">{slide.subtitle}</p>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">{slide.title}</h1>
                    <p className="text-lg text-gray-600 mb-8">{slide.description}</p>
                    <Link
                      href={slide.ctaLink}
                      className="inline-block px-8 py-4 bg-cta hover:bg-cta-hover text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg"
                    >
                      {slide.cta}
                    </Link>
                  </div>
                  <div className="hidden md:flex justify-center">
                    <div className="text-8xl lg:text-9xl">👶</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'bg-secondary0 w-8' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/?category=${cat.slug}`}
                className="group bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <h3 className="font-semibold text-gray-800 group-hover:text-accent transition-colors">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Age */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-pink-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Shop by Age</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {ageGroups.map((age) => (
              <Link
                key={age.slug}
                href={`/?category=${age.slug}`}
                className={`${age.color} p-6 rounded-2xl text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="text-3xl mb-2">👶</div>
                <h3 className="font-semibold text-gray-800">{age.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/categories" className="text-accent hover:text-pink-700 font-medium">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-80 animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/?category=${product.category?.name?.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl">🧸</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-accent text-white text-xs px-2 py-1 rounded-full">
                      New
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-accent font-medium">{product.category?.name || 'Baby'}</p>
                    <h3 className="font-semibold text-gray-800 mt-1 line-clamp-2">{product.name}</h3>
                    <p className="text-lg font-bold text-gray-900 mt-2">KSH {parseFloat(product.price).toLocaleString()}</p>
                    <button className="w-full mt-3 bg-cta hover:bg-cta-hover text-white py-2 rounded-lg transition-colors text-sm font-medium">
                      Add to Cart
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No products available yet.</p>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-accent to-[#C8A98D]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">🎉 Free Shipping on Orders Over KSH 5,000</h2>
          <p className="text-white/90 text-lg mb-6">Delivery across Kenya - Nairobi, Mombasa, Kisumu & More</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-white text-accent font-semibold rounded-full hover:shadow-lg transition-all"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Secure M-Pesa</h3>
              <p className="text-sm text-gray-600">STK Push payments with instant confirmation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Nationwide Delivery</h3>
              <p className="text-sm text-gray-600">Fast delivery across Kenya</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">↩️</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Easy Returns</h3>
              <p className="text-sm text-gray-600">30-day return policy</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Quality Guaranteed</h3>
              <p className="text-sm text-gray-600">Vetted safe products</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">What Parents Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex text-yellow-400 mb-3">★★★★★</div>
              <p className="text-gray-600 mb-4">"Fast delivery and great prices. My baby loves the blanket!"</p>
              <p className="font-semibold text-gray-800">- Grace, Nairobi</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex text-yellow-400 mb-3">★★★★★</div>
              <p className="text-gray-600 mb-4">"Finally found a trustworthy online baby store. Quality products!"</p>
              <p className="font-semibold text-gray-800">- Peter, Mombasa</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex text-yellow-400 mb-3">★★★★★</div>
              <p className="text-gray-600 mb-4">"Great customer service and M-Pesa made payment so easy."</p>
              <p className="font-semibold text-gray-800">- Aisha, Kisumu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-gray-600 mb-6">Get exclusive offers and updates on new baby products.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 p-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
            <button
              type="submit"
              className="px-8 py-4 bg-cta hover:bg-cta-hover text-white font-semibold rounded-full transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
