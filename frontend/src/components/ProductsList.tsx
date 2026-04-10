"use client"

import React, { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import ProductCard from './ProductCard'

const PAGE_SIZE = 24

type QueryParams = Record<string, string | number | boolean | null | undefined>

// Fallback sample products for when API is unavailable
const SAMPLE_PRODUCTS = [
  { id: 1, name: 'Baby Cotton Onesie Set', slug: 'baby-cotton-onesie-set', price: '1599', image: null, is_active: true },
  { id: 2, name: 'Soft Jersey Babygrow', slug: 'soft-jersey-babygrow', price: '1299', image: null, is_active: true },
  { id: 3, name: 'Premium Baby Blanket', slug: 'premium-baby-blanket', price: '2499', image: null, is_active: true },
  { id: 4, name: 'Baby Socks 3-Pack', slug: 'baby-socks-3-pack', price: '599', image: null, is_active: true },
  { id: 5, name: 'Crochet Baby Hat', slug: 'crochet-baby-hat', price: '799', image: null, is_active: true },
  { id: 6, name: 'Muslin Swaddle Wrap', slug: 'muslin-swaddle-wrap', price: '1899', image: null, is_active: true },
  { id: 7, name: 'Baby Bib Set', slug: 'baby-bib-set', price: '699', image: null, is_active: true },
  { id: 8, name: 'Knitted Cardigan', slug: 'knitted-cardigan', price: '2299', image: null, is_active: true },
]

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-[var(--bg-soft)] rounded-xl mb-3" />
      <div className="h-3 w-12 bg-[var(--bg-soft)] rounded mb-2" />
      <div className="h-4 w-full bg-[var(--bg-soft)] rounded mb-2" />
      <div className="h-3 w-3/4 bg-[var(--bg-soft)] rounded mb-2" />
      <div className="h-5 w-16 bg-[var(--bg-soft)] rounded" />
    </div>
  )
}

export default function ProductsList({ queryParams }: { queryParams?: QueryParams }) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [usedFallback, setUsedFallback] = useState(false)

  const queryParamsKey = useMemo(() => JSON.stringify(queryParams ?? {}), [queryParams])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')

    let parsedQueryParams: QueryParams = {}
    try {
      parsedQueryParams = JSON.parse(queryParamsKey) as QueryParams
    } catch {
      parsedQueryParams = {}
    }

    api
      .get('/products/products/', { params: { page, page_size: PAGE_SIZE, ...parsedQueryParams } })
      .then((res) => {
        if (!mounted) return
        const data = res.data
        const loadedProducts = data?.results || data || []
        
        // Filter out inactive products
        const activeProducts = loadedProducts.filter((p: any) => p.is_active !== false)
        
        setProducts(activeProducts)
        setTotal(data?.count || activeProducts.length || 0)
        setUsedFallback(false)
      })
      .catch((err) => {
        if (!mounted) return
        console.error('Products API error:', err)
        // Use fallback data instead of showing error
        setProducts(SAMPLE_PRODUCTS)
        setTotal(SAMPLE_PRODUCTS.length)
        setUsedFallback(true)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [page, queryParamsKey])

  // Show skeletons while loading
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {[...Array(PAGE_SIZE)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Show error with retry button if not using fallback
  if (!usedFallback && error && products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--text-secondary)] mb-4">{error}</p>
        <button
          onClick={() => { setPage(1); setProducts([]) }}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Show products (either from API or fallback)
  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--text-secondary)]">No products found</p>
      </div>
    )
  }

  const hasNext = page * PAGE_SIZE < total

  return (
    <div>
      {usedFallback && (
        <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          Showing sample products. Live products will appear when connected to the backend.
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-3 py-2 bg-white border rounded disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        <div className="text-sm text-gray-600">Page {page}</div>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNext}
          className="px-3 py-2 bg-white border rounded disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
