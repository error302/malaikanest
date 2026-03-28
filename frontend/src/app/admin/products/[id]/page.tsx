'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import api, { handleApiError } from '@/lib/api'

interface Category {
  id: number
  name: string
  full_slug: string
  level: number
}

type FieldErrors = Record<string, string>

type VariantDraft = {
  id?: number
  color: string
  stock: string
  sku: string
  price_modifier: string
  image: File | null
  imagePreview: string | null
}

interface ProductDetail {
  id: number
  name: string
  slug: string
  description: string
  price: string
  compare_price?: string | null
  discount_price?: string | null
  category: number
  stock: number
  sku?: string | null
  is_active: boolean
  featured: boolean
  gender: string
  age_group?: string | null
  age_range?: string | null
  size_label?: string | null
  status: string
  image?: string | null
  image_full_url?: string | null
  image_url?: string | null
  variants?: Array<{
    id: number
    color?: string
    stock?: number
    sku?: string | null
    price_modifier?: string
    image?: string | null
  }>
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const ageGroups = [
  { label: 'Baby (0-2)', value: 'baby' },
  { label: 'Toddler (2-5)', value: 'toddler' },
  { label: 'Kids (6-12)', value: 'kids' },
]

const ageRanges = ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-3 years', '3-5 years', '6-8 years', '9-12 years']
const sizes = ['newborn', '0-3m', '3-6m', '6-12m', '1y', '2y', '3y', '4y', '5y', '6y', '7y', '8y', '9y', '10y', '11y', '12y']
const variantColors = [
  { label: 'White', value: 'white' },
  { label: 'Black', value: 'black' },
  { label: 'Gray', value: 'gray' },
  { label: 'Pink', value: 'pink' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Red', value: 'red' },
  { label: 'Purple', value: 'purple' },
  { label: 'Orange', value: 'orange' },
  { label: 'Brown', value: 'brown' },
  { label: 'Beige', value: 'beige' },
  { label: 'Multi', value: 'multi' },
]

function buildFieldErrors(payload: any): FieldErrors {
  const details = payload?.error?.details ?? payload
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {}

  return Object.entries(details).reduce<FieldErrors>((acc, [field, value]) => {
    if (typeof value === 'string' && value.trim()) {
      acc[field] = value
      return acc
    }

    if (Array.isArray(value) && value.length > 0) {
      acc[field] = String(value[0])
      return acc
    }

    if (value && typeof value === 'object') {
      const nested = (value as any).detail || (value as any).message
      if (nested) {
        acc[field] = Array.isArray(nested) ? String(nested[0]) : String(nested)
      }
    }

    return acc
  }, {})
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  const [categories, setCategories] = useState<Category[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [variants, setVariants] = useState<VariantDraft[]>([])
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
    image_url: '',
    sku: '',
  })

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        const [categoriesRes, productRes] = await Promise.all([
          api.get('/api/products/admin/categories/'),
          api.get(`/api/products/admin/products/${productId}/`),
        ])

        const nextCategories = Array.isArray(categoriesRes.data) ? categoriesRes.data : []
        const product: ProductDetail = productRes.data

        setCategories(nextCategories)
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          price: product.price ? String(product.price) : '',
          compare_price: product.compare_price ? String(product.compare_price) : '',
          discount_price: product.discount_price ? String(product.discount_price) : '',
          category: product.category ? String(product.category) : '',
          stock: product.stock != null ? String(product.stock) : '',
          is_active: Boolean(product.is_active),
          featured: Boolean(product.featured),
          gender: product.gender || 'unisex',
          age_group: product.age_group || '',
          age_range: product.age_range || '',
          size_label: product.size_label || '',
          status: product.status || 'published',
          image_url: product.image_url || '',
          sku: product.sku || '',
        })
        setImagePreview(product.image_full_url || product.image || null)
        setVariants(
          (product.variants || []).map((variant) => ({
            id: variant.id,
            color: variant.color || '',
            stock: String(variant.stock ?? 0),
            sku: variant.sku || '',
            price_modifier: variant.price_modifier || '0',
            image: null,
            imagePreview: variant.image || null,
          }))
        )
      } catch (loadError) {
        setError(handleApiError(loadError, 'Could not load this product for editing.'))
      } finally {
        setInitialLoading(false)
      }
    }

    if (productId) {
      void load()
    }
  }, [productId])

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.full_slug.localeCompare(b.full_slug)),
    [categories]
  )

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      if (!(fieldName in prev)) return prev
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    clearFieldError(name)
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    clearFieldError('image')
    setImage(file)

    if (!file) {
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, image: 'Only JPG, PNG, and WEBP images are allowed.' }))
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFieldErrors((prev) => ({ ...prev, image: 'Image must be 5 MB or smaller.' }))
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const addVariantRow = () => {
    setVariants((current) => [
      ...current,
      { color: '', stock: '', sku: '', price_modifier: '0', image: null, imagePreview: null },
    ])
  }

  const updateVariant = (index: number, key: keyof VariantDraft, value: string | File | null) => {
    setVariants((current) =>
      current.map((variant, variantIndex) => (variantIndex === index ? { ...variant, [key]: value } : variant))
    )
  }

  const handleVariantImageChange = (index: number, file: File | null) => {
    if (!file) {
      setVariants((current) => current.map((variant, variantIndex) => (
        variantIndex === index ? { ...variant, image: null } : variant
      )))
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Variant images must be JPG, PNG, or WEBP and 5 MB or smaller.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setVariants((current) => current.map((variant, variantIndex) => (
        variantIndex === index ? { ...variant, image: file, imagePreview: reader.result as string } : variant
      )))
    }
    reader.readAsDataURL(file)
  }

  const removeVariant = (index: number) => {
    setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setSaving(true)

    try {
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('slug', formData.slug)
      payload.append('description', formData.description)
      payload.append('price', formData.price)
      payload.append('compare_price', formData.compare_price)
      payload.append('discount_price', formData.discount_price)
      payload.append('category', formData.category)
      payload.append('stock', formData.stock)
      payload.append('sku', formData.sku)
      payload.append('is_active', formData.is_active ? 'true' : 'false')
      payload.append('featured', formData.featured ? 'true' : 'false')
      payload.append('gender', formData.gender)
      payload.append('age_group', formData.age_group)
      payload.append('age_range', formData.age_range)
      payload.append('size_label', formData.size_label)
      payload.append('status', formData.status)
      payload.append('image_url', formData.image_url)

      if (image) {
        payload.append('image', image)
      }

      payload.append(
        'variants',
        JSON.stringify(
          variants.map((variant) => ({
            id: variant.id,
            color: variant.color,
            stock: Number(variant.stock || 0),
            sku: variant.sku || null,
            price_modifier: variant.price_modifier || '0',
            is_active: true,
          }))
        )
      )

      variants.forEach((variant, index) => {
        if (variant.image) {
          payload.append(`variant_image_${index}`, variant.image)
        }
      })

      await api.patch(`/api/products/admin/products/${productId}/`, payload)
      router.push('/admin/products')
    } catch (submitError: any) {
      const nextFieldErrors = buildFieldErrors(submitError?.response?.data)
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors)
      }
      setError(handleApiError(submitError, 'Could not save product changes.'))
    } finally {
      setSaving(false)
    }
  }

  if (initialLoading) {
    return <div className="p-6">Loading product editor...</div>
  }

  return (
    <div className="mx-auto max-w-4xl rounded-xl border bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Edit Product</h2>
        <Link href="/admin/products" className="text-sm text-slate-600">Back</Link>
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
            <input name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border px-4 py-3" required />
            {fieldErrors.name && <p className="text-xs text-red-600">{fieldErrors.name}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Slug (URL)</label>
            <input name="slug" value={formData.slug} onChange={handleChange} className="w-full rounded-lg border px-4 py-3 font-mono text-sm" required />
            {fieldErrors.slug && <p className="text-xs text-red-600">{fieldErrors.slug}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Price (KES) *</label>
            <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} className="w-full rounded-lg border px-4 py-3" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Compare Price (KES)</label>
            <input name="compare_price" type="number" min="0" step="0.01" value={formData.compare_price} onChange={handleChange} className="w-full rounded-lg border px-4 py-3" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Discount Price (KES)</label>
            <input name="discount_price" type="number" min="0" step="0.01" value={formData.discount_price} onChange={handleChange} className="w-full rounded-lg border px-4 py-3" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Stock Quantity *</label>
            <input name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} className="w-full rounded-lg border px-4 py-3" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">SKU</label>
            <input name="sku" value={formData.sku} onChange={handleChange} className="w-full rounded-lg border px-4 py-3" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border px-4 py-3" required>
              <option value="">Select category</option>
              {sortedCategories.map((category) => (
                <option key={category.id} value={category.id}>{`${'- '.repeat(category.level)}/${category.full_slug}`}</option>
              ))}
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
          <textarea name="description" value={formData.description} onChange={handleChange} className="w-full rounded-lg border px-4 py-3" rows={4} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Product Image</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="w-full text-sm" />
        </div>

        {imagePreview && (
          <div>
            <p className="mb-2 text-xs text-slate-500">Current image</p>
            <Image src={imagePreview} alt="Product preview" width={192} height={192} unoptimized className="h-48 w-48 rounded-lg border object-cover" />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Image URL (Cloudinary)</label>
          <input name="image_url" value={formData.image_url} onChange={handleChange} className="w-full rounded-lg border px-4 py-3 text-sm" />
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Color variations</h3>
              <p className="text-xs text-slate-500">Edit existing colors or add new ones for this product.</p>
            </div>
            <button type="button" onClick={addVariantRow} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
              Add Color
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No color variants yet. Add one if this product should have multiple color options.
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={`${variant.id || 'new'}-${index}`} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Color #{index + 1}</p>
                    <button type="button" onClick={() => removeVariant(index)} className="text-sm text-red-600">
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Color *</label>
                      <select value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} className="w-full rounded-lg border px-4 py-3">
                        <option value="">Select color</option>
                        {variantColors.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Variant Stock *</label>
                      <input type="number" min="0" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', e.target.value)} className="w-full rounded-lg border px-4 py-3" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Variant SKU</label>
                      <input type="text" value={variant.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} className="w-full rounded-lg border px-4 py-3" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Price Modifier (KES)</label>
                      <input type="number" step="0.01" value={variant.price_modifier} onChange={(e) => updateVariant(index, 'price_modifier', e.target.value)} className="w-full rounded-lg border px-4 py-3" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Variant Image</label>
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => handleVariantImageChange(index, e.target.files?.[0] || null)} className="w-full text-sm" />
                    </div>
                  </div>

                  {variant.imagePreview && (
                    <div className="mt-3">
                      <Image src={variant.imagePreview} alt={`Variant ${index + 1}`} width={120} height={120} unoptimized className="h-24 w-24 rounded-lg border object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
            Active
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} />
            Featured
          </label>
        </div>

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-amber-700 px-6 py-3 font-medium text-white disabled:opacity-50">
            {saving ? 'Saving changes...' : 'Save Changes'}
          </button>
          <Link href="/admin/products" className="rounded-lg border px-6 py-3 text-sm text-slate-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
