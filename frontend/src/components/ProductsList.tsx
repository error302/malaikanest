"use client"

import React, { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import ProductCard from './ProductCard'

const PAGE_SIZE = 24

type QueryParams = Record<string, string | number | boolean | null | undefined>

export default function ProductsList({ queryParams }: { queryParams?: QueryParams }) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

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
      .get('/api/products/products/', { params: { page, page_size: PAGE_SIZE, ...parsedQueryParams } })
      .then((res) => {
        if (!mounted) return
        const data = res.data
        setProducts(data?.results || data || [])
        setTotal(data?.count || data?.length || 0)
      })
      .catch(() => {
        if (!mounted) return
        setProducts([])
        setTotal(0)
        setError('Failed to load products. Please try again.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [page, queryParamsKey])

  if (loading) return <div className="py-12 text-center">Loading products...</div>
  if (error) return <div className="py-12 text-center text-red-600">{error}</div>

  const hasNext = page * PAGE_SIZE < total

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
