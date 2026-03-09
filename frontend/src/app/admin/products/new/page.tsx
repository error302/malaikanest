'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Category {
  id: number
  name: string
}

export default function NewProduct() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    discount_price: '',
    category: '',
    stock: '',
    is_active: true,
    featured: false,
    gender: 'unisex',
    status: 'published',
  })

  useEffect(() => {
    api.get('/api/products/categories/').then((res) => setCategories(Array.isArray(res.data) ? res.data : [])).catch(() => setCategories([]))
  }, [])

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && formData.name) {
      const autoSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      setFormData((prev) => ({ ...prev, slug: autoSlug }))
    }
  }, [formData.name, slugManuallyEdited])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (name === 'slug') setSlugManuallyEdited(true)
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const form = new FormData()
      form.append('name', formData.name)
      form.append('slug', formData.slug)
      form.append('description', formData.description)
      form.append('price', formData.price)
      if (formData.discount_price) form.append('discount_price', formData.discount_price)
      form.append('category', formData.category)
      form.append('stock', formData.stock)
      form.append('is_active', formData.is_active ? 'true' : 'false')
      form.append('featured', formData.featured ? 'true' : 'false')
      form.append('gender', formData.gender)
      form.append('status', formData.status)
      if (image) form.append('image', image)

      await api.post('/api/products/admin/products/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      router.push('/admin/products')
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.response?.data?.name?.[0] || err?.response?.data?.slug?.[0] || 'Failed to create product. Please check all fields.'
      setError(Array.isArray(detail) ? detail[0] : String(detail))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Add New Product</h2>
        <Link href="/admin/products" className="text-sm text-slate-600">← Back</Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Product Name *</label>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Baby Comfort Blanket" className="w-full px-4 py-3 border rounded-lg" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Slug (URL) — auto-generated</label>
            <input name="slug" value={formData.slug} onChange={handleChange} placeholder="baby-comfort-blanket" className="w-full px-4 py-3 border rounded-lg font-mono text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Price (KES) *</label>
            <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-3 border rounded-lg" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Discount Price (KES)</label>
            <input name="discount_price" type="number" min="0" step="0.01" value={formData.discount_price} onChange={handleChange} placeholder="Leave blank if none" className="w-full px-4 py-3 border rounded-lg" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Stock Quantity *</label>
            <input name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} placeholder="0" className="w-full px-4 py-3 border rounded-lg" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" required>
              <option value="">Select category</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg">
              <option value="unisex">Unisex</option>
              <option value="girl">Girl</option>
              <option value="boy">Boy</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the product..." className="w-full px-4 py-3 border rounded-lg" rows={4} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Product Image</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
            const file = e.target.files?.[0] || null
            setImage(file)
            if (file) {
              const reader = new FileReader()
              reader.onloadend = () => setImagePreview(reader.result as string)
              reader.readAsDataURL(file)
            } else {
              setImagePreview(null)
            }
          }} className="w-full text-sm" />
          <p className="text-xs text-slate-400">JPG, PNG, or WEBP — max 5 MB</p>
        </div>

        {imagePreview && (
          <div className="mt-2">
            <p className="text-xs text-slate-500 mb-2">Preview:</p>
            <img src={imagePreview} alt="Preview" className="w-48 h-48 object-cover rounded-lg border" />
          </div>
        )}

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
            Active (visible to customers)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} />
            Featured (shown on homepage)
          </label>
        </div>

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={loading} className="px-6 py-3 bg-amber-700 text-white rounded-lg disabled:opacity-50 font-medium">
            {loading ? 'Creating product...' : 'Create Product'}
          </button>
          <Link href="/admin/products" className="px-6 py-3 border rounded-lg text-sm text-slate-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}