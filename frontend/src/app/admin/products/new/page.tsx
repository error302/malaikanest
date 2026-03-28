'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  color: string
  stock: string
  sku: string
  price_modifier: string
  image_url: string
  image: File | null
  imagePreview: string | null
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

export default function NewProduct() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
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
    if (name === 'slug') setSlugManuallyEdited(true)
    clearFieldError(name)
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    clearFieldError('image')
    setImage(file)

    if (!file) {
      setImagePreview(null)
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, image: 'Only JPG, PNG, and WEBP images are allowed.' }))
      setImagePreview(null)
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFieldErrors((prev) => ({ ...prev, image: 'Image must be 5 MB or smaller.' }))
      setImagePreview(null)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const addVariantRow = () => {
    setVariants((current) => [
      ...current,
      {
        color: '',
        stock: '',
        sku: '',
        price_modifier: '0',
        image_url: '',
        image: null,
        imagePreview: null,
      },
    ])
  }

  const updateVariant = (index: number, key: keyof VariantDraft, value: string | File | null) => {
    setVariants((current) => current.map((variant, variantIndex) => {
      if (variantIndex !== index) return variant
      return { ...variant, [key]: value }
    }))
  }

  const handleVariantImageChange = (index: number, file: File | null) => {
    if (!file) {
      setVariants((current) => current.map((variant, variantIndex) => (
        variantIndex === index
          ? { ...variant, image: null, imagePreview: variant.image_url || null }
          : variant
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

  const handleVariantImageUrlChange = (index: number, value: string) => {
    setVariants((current) => current.map((variant, variantIndex) => {
      if (variantIndex !== index) return variant

      const normalizedUrl = value.trim()
      return {
        ...variant,
        image_url: value,
        imagePreview: variant.image ? variant.imagePreview : normalizedUrl || null,
      }
    }))
  }

  const removeVariant = (index: number) => {
    setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (image) {
      if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
        setFieldErrors({ image: 'Only JPG, PNG, and WEBP images are allowed.' })
        setError('Product image must be a JPG, PNG, or WEBP file.')
        return
      }

      if (image.size > MAX_IMAGE_SIZE_BYTES) {
        setFieldErrors({ image: 'Image must be 5 MB or smaller.' })
        setError('Product image must be 5 MB or smaller.')
        return
      }
    }

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
      if (formData.image_url) form.append('image_url', formData.image_url)
      if (variants.length > 0) {
        form.append(
          'variants',
          JSON.stringify(
            variants.map((variant) => ({
              color: variant.color,
              stock: Number(variant.stock || 0),
              sku: variant.sku || null,
              price_modifier: variant.price_modifier || '0',
              image_url: variant.image_url || null,
              is_active: true,
            }))
          )
        )
        variants.forEach((variant, index) => {
          if (variant.image) {
            form.append(`variant_image_${index}`, variant.image)
          }
        })
      }

      await api.post('/api/products/admin/products/', form)
      router.push('/admin/products')
    } catch (err: any) {
      const nextFieldErrors = buildFieldErrors(err?.response?.data)
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors)
      }
      setError(handleApiError(err, 'Failed to create product. Please check the highlighted fields.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl rounded-xl border bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Add New Product</h2>
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
            <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Boys School Hoodie" className="w-full rounded-lg border px-4 py-3" required />
            {fieldErrors.name && <p className="text-xs text-red-600">{fieldErrors.name}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Slug (URL)</label>
            <input name="slug" value={formData.slug} onChange={handleChange} placeholder="boys-school-hoodie" className="w-full rounded-lg border px-4 py-3 font-mono text-sm" required />
            {fieldErrors.slug && <p className="text-xs text-red-600">{fieldErrors.slug}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Price (KES) *</label>
            <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} placeholder="0.00" className="w-full rounded-lg border px-4 py-3" required />
            {fieldErrors.price && <p className="text-xs text-red-600">{fieldErrors.price}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Compare Price (KES)</label>
            <input name="compare_price" type="number" min="0" step="0.01" value={formData.compare_price} onChange={handleChange} placeholder="Original price" className="w-full rounded-lg border px-4 py-3" />
            {fieldErrors.compare_price && <p className="text-xs text-red-600">{fieldErrors.compare_price}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Discount Price (KES)</label>
            <input name="discount_price" type="number" min="0" step="0.01" value={formData.discount_price} onChange={handleChange} placeholder="Optional sale price" className="w-full rounded-lg border px-4 py-3" />
            {fieldErrors.discount_price && <p className="text-xs text-red-600">{fieldErrors.discount_price}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Stock Quantity *</label>
            <input name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} placeholder="0" className="w-full rounded-lg border px-4 py-3" required />
            {fieldErrors.stock && <p className="text-xs text-red-600">{fieldErrors.stock}</p>}
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border px-4 py-3" required>
              <option value="">Select category</option>
              {sortedCategories.map((category) => <option key={category.id} value={category.id}>{`${'- '.repeat(category.level)}/${category.full_slug}`}</option>)}
            </select>
            {fieldErrors.category && <p className="text-xs text-red-600">{fieldErrors.category}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-lg border px-4 py-3">
              <option value="unisex">Unisex</option>
              <option value="girl">Girl</option>
              <option value="boy">Boy</option>
            </select>
            {fieldErrors.gender && <p className="text-xs text-red-600">{fieldErrors.gender}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Age Group</label>
            <select name="age_group" value={formData.age_group} onChange={handleChange} className="w-full rounded-lg border px-4 py-3">
              <option value="">Select age group</option>
              {ageGroups.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {fieldErrors.age_group && <p className="text-xs text-red-600">{fieldErrors.age_group}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Age Range</label>
            <select name="age_range" value={formData.age_range} onChange={handleChange} className="w-full rounded-lg border px-4 py-3">
              <option value="">Select age range</option>
              {ageRanges.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            {fieldErrors.age_range && <p className="text-xs text-red-600">{fieldErrors.age_range}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Primary Size</label>
            <select name="size_label" value={formData.size_label} onChange={handleChange} className="w-full rounded-lg border px-4 py-3">
              <option value="">Select size</option>
              {sizes.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
            </select>
            {fieldErrors.size_label && <p className="text-xs text-red-600">{fieldErrors.size_label}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border px-4 py-3">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            {fieldErrors.status && <p className="text-xs text-red-600">{fieldErrors.status}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the product..." className="w-full rounded-lg border px-4 py-3" rows={4} />
          {fieldErrors.description && <p className="text-xs text-red-600">{fieldErrors.description}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Product Image</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="w-full text-sm" />
          <p className="text-xs text-slate-400">JPG, PNG, or WEBP - max 5 MB</p>
          {fieldErrors.image && <p className="text-xs text-red-600">{fieldErrors.image}</p>}
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Color variations</h3>
              <p className="text-xs text-slate-500">Add optional color variants so customers can switch between colors on the product page.</p>
            </div>
            <button type="button" onClick={addVariantRow} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
              Add Color
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No color variants yet. Leave this blank for a single-color product.
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={`${variant.color}-${index}`} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Color #{index + 1}</p>
                    <button type="button" onClick={() => removeVariant(index)} className="text-sm text-red-600">
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Color *</label>
                      <select
                        value={variant.color}
                        onChange={(e) => updateVariant(index, 'color', e.target.value)}
                        className="w-full rounded-lg border px-4 py-3"
                        required
                      >
                        <option value="">Select color</option>
                        {variantColors.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Variant Stock *</label>
                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        className="w-full rounded-lg border px-4 py-3"
                        placeholder="0"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Variant SKU</label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        className="w-full rounded-lg border px-4 py-3"
                        placeholder="Optional SKU"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Price Modifier (KES)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.price_modifier}
                        onChange={(e) => updateVariant(index, 'price_modifier', e.target.value)}
                        className="w-full rounded-lg border px-4 py-3"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Variant Image</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => handleVariantImageChange(index, e.target.files?.[0] || null)}
                        className="w-full text-sm"
                      />
                      <p className="text-xs text-slate-400">Optional image for this specific color.</p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Variant Image URL (Cloudinary)</label>
                      <input
                        type="url"
                        value={variant.image_url}
                        onChange={(e) => handleVariantImageUrlChange(index, e.target.value)}
                        className="w-full rounded-lg border px-4 py-3 text-sm"
                        placeholder="https://res.cloudinary.com/.../image/upload/..."
                      />
                      <p className="text-xs text-slate-400">Paste a Cloudinary image URL if this color already has a hosted asset.</p>
                    </div>
                  </div>

                  {variant.imagePreview && (
                    <div className="mt-3">
                      <Image
                        src={variant.imagePreview}
                        alt={`Variant ${index + 1}`}
                        width={120}
                        height={120}
                        unoptimized
                        className="h-24 w-24 rounded-lg border object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Or Image URL (Cloudinary)</label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://res.cloudinary.com/.../image.jpg"
            className="w-full rounded-lg border px-4 py-3 text-sm"
          />
          <p className="text-xs text-slate-400">Paste a Cloudinary or external image URL</p>
          {fieldErrors.image_url && <p className="text-xs text-red-600">{fieldErrors.image_url}</p>}
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
