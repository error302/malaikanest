"use client"
import React, { useState, useEffect } from 'react'
import api from '../lib/api'
import ProductCard from './ProductCard'

export default function ProductsList({ queryParams }: { queryParams?: any }) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.get('/api/products/', { params: { page, ...queryParams } })
      .then(res => {
        if (!mounted) return
        setProducts(res.data.results || res.data)
        setTotal(res.data.count || res.data.length || 0)
      })
      .catch(err => console.error('Failed to load products', err))
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [page, JSON.stringify(queryParams || {})])

  if (loading) return <div className="py-12 text-center">Loading products...</div>

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-2 bg-white border rounded">Prev</button>
        <div className="text-sm text-gray-600">Page {page}</div>
        <button onClick={() => setPage(p => p+1)} className="px-3 py-2 bg-white border rounded">Next</button>
      </div>
    </div>
  )
}
