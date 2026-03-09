'use client'

import { useEffect, useState } from 'react'
import api, { handleApiError } from '@/lib/api'
import { shouldUseUnoptimizedImage } from '@/lib/media'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  slug: string
  price: string
  category_name?: string
  stock: number
  is_active: boolean
  image?: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setError(null)
      const res = await api.get('/api/products/admin/products/')
      const data = Array.isArray(res.data) ? res.data : res.data?.results || []
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      setError(handleApiError(error, 'Could not load products right now.'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return

    setError(null)
    setSuccess(null)

    try {
      await api.delete(`/api/products/admin/products/${id}/`)
      setProducts((current) => current.filter((product) => product.id !== id))
      setSuccess('Product deleted.')
    } catch (error) {
      console.error('Error deleting product:', error)
      setError(handleApiError(error, 'Product could not be deleted.'))
    }
  }

  const handleToggleActive = async (product: Product) => {
    setError(null)
    setSuccess(null)

    try {
      await api.patch(`/api/products/admin/products/${product.id}/`, { is_active: !product.is_active })
      setProducts((current) => current.map((item) => (
        item.id === product.id ? { ...item, is_active: !item.is_active } : item
      )))
      setSuccess(`Product ${product.is_active ? 'deactivated' : 'activated'}.`)
    } catch (error) {
      console.error('Error updating product:', error)
      setError(handleApiError(error, 'Product status could not be updated.'))
    }
  }

  if (loading) return <div className="p-6">Loading products...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        <Link href="/admin/products/new" className="px-4 py-2 bg-amber-700 text-white rounded-lg">Add Product</Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs">Product</th>
              <th className="px-4 py-3 text-left text-xs">Category</th>
              <th className="px-4 py-3 text-left text-xs">Price</th>
              <th className="px-4 py-3 text-left text-xs">Stock</th>
              <th className="px-4 py-3 text-left text-xs">Status</th>
              <th className="px-4 py-3 text-left text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No products found yet.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized={shouldUseUnoptimizedImage(product.image)} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D4A853] to-[#8B4513] text-white font-semibold">
                            {product.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{product.category_name || 'Uncategorized'}</td>
                  <td className="px-4 py-3 text-sm">KES {Number(product.price).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{product.stock}</td>
                  <td className="px-4 py-3 text-sm">{product.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleToggleActive(product)} className="px-3 py-1 bg-slate-100 rounded text-xs">{product.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => handleDelete(product.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
