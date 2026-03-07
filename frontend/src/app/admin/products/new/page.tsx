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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      await api.post('/api/products/admin/products/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      router.push('/admin/products')
    } catch (error) {
      console.error('Error creating product:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Add New Product</h2>
        <Link href="/admin/products" className="text-sm text-slate-600">Back</Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Product name" className="px-4 py-3 border rounded-lg" required />
          <input name="slug" value={formData.slug} onChange={handleChange} placeholder="product-slug" className="px-4 py-3 border rounded-lg" required />
          <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price" className="px-4 py-3 border rounded-lg" required />
          <input name="discount_price" type="number" value={formData.discount_price} onChange={handleChange} placeholder="Discount price" className="px-4 py-3 border rounded-lg" />
          <input name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="Stock" className="px-4 py-3 border rounded-lg" required />
          <select name="category" value={formData.category} onChange={handleChange} className="px-4 py-3 border rounded-lg" required>
            <option value="">Select category</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <select name="gender" value={formData.gender} onChange={handleChange} className="px-4 py-3 border rounded-lg">
            <option value="unisex">Unisex</option>
            <option value="girl">Girl</option>
            <option value="boy">Boy</option>
          </select>
          <select name="status" value={formData.status} onChange={handleChange} className="px-4 py-3 border rounded-lg">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="w-full px-4 py-3 border rounded-lg" rows={4} />

        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} />

        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} /> Active</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} /> Featured</label>
        </div>

        <button type="submit" disabled={loading} className="px-6 py-3 bg-amber-700 text-white rounded-lg disabled:opacity-50">{loading ? 'Saving...' : 'Create Product'}</button>
      </form>
    </div>
  )
}