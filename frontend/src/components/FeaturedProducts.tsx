"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import api from '../lib/api'
import { LoadingGrid } from './Loading'
import { useCart } from '../lib/cartContext'
import { shouldUseUnoptimizedImage } from '../lib/media'
import ProductCard from './ProductCard'
import { ShoppingCart } from 'lucide-react'

interface Product {
  id: number
  name: string
  slug: string
  price: string
  image: string | null
  stock?: number
  category: { name: string }
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [ageFilter, setAgeFilter] = useState('all')
  const { add } = useCart()

  useEffect(() => {
    let mounted = true
    api.get('/api/products/products/')
      .then(res => {
        if (mounted) {
          const data = res.data
          const rows = Array.isArray(data) ? data : (data?.results ?? [])
          setProducts(rows)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setError(true)
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingGrid count={4} />

  if (error) return (
    <div className="text-center py-8 text-[var(--text-secondary)]">
      Unable to load products. Please try again later.
    </div>
  )

  if (products.length === 0) return (
    <div className="text-center py-8 text-[var(--text-secondary)]">
      No products available at the moment.
    </div>
  )

  const filteredProducts = products.filter(p => {
    if (ageFilter === 'all') return true

    // Size recommender logic based on product data heuristics
    const textInfo = (p.name + ' ' + (p.category?.name || '')).toLowerCase()
    if (ageFilter === 'newborn') return textInfo.includes('newborn') || textInfo.includes('0-3') || textInfo.includes('new born')
    if (ageFilter === 'infant') return textInfo.includes('3-6') || textInfo.includes('6-12') || textInfo.includes('months')
    if (ageFilter === 'toddler') return textInfo.includes('year') || textInfo.includes('toddler') || textInfo.includes('12-24')
    if (ageFilter === 'maternity') return textInfo.includes('maternity') || textInfo.includes('mom') || textInfo.includes('nursing')
    return true
  })

  return (
    <div>
      <div className="mb-6 bg-[var(--bg-surface)] rounded-xl p-4 md:flex items-center justify-between border border-[var(--border)]">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            Smart Size Recommender
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Select the age to find perfect fitting clothes or maternity essentials.</p>
        </div>
        <div className="mt-3 md:mt-0">
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="w-full md:w-auto p-2.5 rounded-lg border-[var(--border)] shadow-sm focus:border-[var(--accent)] focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] bg-[var(--bg-card)]"
          >
            <option value="all">Shop All Ages</option>
            <option value="newborn">Newborn (0-3 Months)</option>
            <option value="infant">Infants (3-12 Months)</option>
            <option value="toddler">Toddlers (1-3 Years)</option>
            <option value="maternity">Mothers & Maternity</option>
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)] bg-[var(--bg-surface)] rounded-lg">
          No items match this age group currently. Try another filter.
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.slice(0, 8).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
