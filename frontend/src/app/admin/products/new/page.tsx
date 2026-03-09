'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import api from '@/lib/api'

interface Category {
  id: number
  name: string
  full_slug: string
  level: number
}

const ageGroups = [
  { label: 'Baby (0-2)', value: 'baby' },
  { label: 'Toddler (2-5)', value: 'toddler' },
  { label: 'Kids (6-12)', value: 'kids' },
]

const ageRanges = ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-3 years', '3-5 years', '6-8 years', '9-12 years']
const sizes = ['newborn', '0-3m', '3-6m', '6-12m', '1y', '2y', '3y', '4y', '5y', '6y', '7y', '8y', '9y', '10y', '11y', '12y']

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
    compare_price: '',
    discount_price: '',
    category: '',
    stock: '',
    is_active: true,
    featured: false,
    gender: 'unisex',
    age_group: '',
    age_range: '',
    size_label: '',
    status: 'published',
  })

  useEffect(() => {
    api.get('/api/products/admin/categories/').then((res) => setCategories(Array.isArray(res.data) ? res.data : [])).catch(() => setCategories([]))
  }, [])

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.full_slug.localeCompare(b.full_slug)),
    [categories]
  )

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
      if (formData.compare_price) form.append('compare_price', formData.compare_price)
      if (formData.discount_price) form.append('discount_price', formData.discount_price)
      form.append('category', formData.category)
      form.append('stock', formData.stock)
      form.append('is_active', formData.is_active ? 'true' : 'false')
      form.append('featured', formData.featured ? 'true' : 'false')
      form.append('gender', formData.gender)
      if (formData.age_group) form.append('age_group', formData.age_group)
      if (formData.age_range) form.append('age_range', formData.age_range)
      if (formData.size_label) form.append('size_label', formData.size_label)
      form.append('status', formData.status)
      if (image) form.append('image', image)

      await api.post('/api/products/admin/products/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
    <div className="mx-auto max-w-4xl rounded-xl border bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Add New Product</h2>
        <Link href="/admin/products" className="text-sm text-slate-600">← Back</Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Product Name *</label>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Boys School Hoodie" className="w-full rounded-lg border px-4 py-3" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Slug (URL)</label>
            <input name="slug" value={formData.slug} onChange={handleChange} placeholder="boys-school-hoodie" className="w-full rounded-lg border px-4 py-3 font-mono text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Price (KES) *</label>
            <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} placeholder="0.00" className="w-full rounded-lg border px-4 py-3" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Compare Price (KES)</label>
            <input name="compare_price" type="number" min="0" step="0.01" value={formData.compare_price} onChange={handleChange} placeholder="Original price" className="w-full rounded-lg border px-4 py-3" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Discount Price (KES)</label>
            <input name="discount_price" type="number" min="0" step="0.01" value={formData.discount_price} onChange={handleChange} placeholder="Optional sale price" className="w-full rounded-lg border px-4 py-3" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Stock Quantity *</label>
            <input name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} placeholder="0" className="w-full rounded-lg border px-4 py-3" required />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border px-4 py-3" required>
              <option value="">Select category</option>
              {sortedCategories.map((category) => <option key={category.id} value={category.id}>{`${'— '.repeat(category.level)}/${category.full_slug}`}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-lg border px-4 py-3">
              <option value="unisex">Unisex</option>
              <option value="girl">Girl</option>
              <option value="boy">Boy</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Age Group</label>
            <select name="age_group" value={formData.age_group} onChange={handleChange} className="w-full rounded-lg border px-4 py-3">
              <option value="">Select age group</option>
              {ageGroups.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Age Range</label>
            <select name="age_range" value={formData.age_range} onChange={handleChange} className="w-full rounded-lg border px-4 py-3">
              <option value="">Select age range</option>
              {ageRanges.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Primary Size</label>
            <select name="size_label" value={formData.size_label} onChange={handleChange} className="w-full rounded-lg border px-4 py-3">
              <option value="">Select size</option>
              {sizes.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border px-4 py-3">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the product..." className="w-full rounded-lg border px-4 py-3" rows={4} />
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
            <p className="mb-2 text-xs text-slate-500">Preview:</p>
            <Image
              src={imagePreview}
              alt="Preview"
              width={192}
              height={192}
              unoptimized
              className="h-48 w-48 rounded-lg border object-cover"
            />
          </div>
        )}

        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
            Active (visible to customers)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} />
            Featured (shown on homepage)
          </label>
        </div>

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={loading} className="rounded-lg bg-amber-700 px-6 py-3 font-medium text-white disabled:opacity-50">
            {loading ? 'Creating product...' : 'Create Product'}
          </button>
          <Link href="/admin/products" className="rounded-lg border px-6 py-3 text-sm text-slate-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
