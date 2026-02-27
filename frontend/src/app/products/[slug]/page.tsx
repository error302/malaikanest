"use client"
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '../../../lib/api'
import { LoadingPage } from '../../../components/Loading'

interface Product {
  id: number
  name: string
  slug: string
  price: string
  description: string
  category: { id: number; name: string; slug: string }
  images: string[]
  stock: number
  is_active: boolean
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    if (!slug) return
    
    api.get(`/api/products/products/?slug=${slug}`)
      .then(res => {
        if (res.data.results && res.data.results.length > 0) {
          setProduct(res.data.results[0])
        } else if (res.data[0]) {
          setProduct(res.data[0])
        } else {
          setError('Product not found')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load product')
        setLoading(false)
      })
  }, [slug])

  if (loading) return <LoadingPage />
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-text">Product Not Found</h1>
          <p className="text-gray-500 mt-2">{error}</p>
          <Link href="/categories" className="inline-block mt-4 text-accent hover:underline">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  const price = parseFloat(product.price)
  const total = price * quantity

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/categories" className="hover:text-accent">Products</Link>
          <span className="mx-2">/</span>
          <Link href={`/?category=${product.category?.slug}`} className="hover:text-accent">{product.category?.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-text">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-secondary rounded-xl overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[selectedImage]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  🧸
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      i === selectedImage ? 'border-accent' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text">{product.name}</h1>
            
            {product.category && (
              <Link 
                href={`/?category=${product.category.slug}`}
                className="text-accent hover:underline text-sm mt-1 inline-block"
              >
                {product.category.name}
              </Link>
            )}

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-text">Ksh {price.toLocaleString()}</span>
            </div>

            <div className="mt-2 text-sm">
              {product.stock > 0 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-red-500">Out of Stock</span>
              )}
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-text mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-secondary rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 border border-secondary rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="mt-6 flex gap-4">
              <button
                disabled={product.stock === 0}
                className="flex-1 py-4 bg-cta hover:bg-cta-hover disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
              >
                Add to Cart - Ksh {total.toLocaleString()}
              </button>
              <button className="w-14 h-14 border border-secondary rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h3 className="font-semibold text-text mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-line">
                {product.description || 'No description available.'}
              </p>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-xl">🚚</span>
                <span>Free delivery over KSH 5,000</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-xl">↩️</span>
                <span>30-day returns</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-xl">🔒</span>
                <span>Secure M-Pesa payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-xl">✅</span>
                <span>Quality guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
