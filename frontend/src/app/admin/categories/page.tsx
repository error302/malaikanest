'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import api, { handleApiError } from '@/lib/api'
import { shouldUseUnoptimizedImage } from '@/lib/media'

interface Category {
  id: number
  name: string
  slug: string
  full_slug: string
  level: number
  parent: number | null
  description?: string
  image?: string | null
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '',
    parent: '',
    description: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.full_slug.localeCompare(b.full_slug)),
    [categories]
  )

  const fetchCategories = async () => {
    try {
      setError('')
      const res = await api.get('/api/products/admin/categories/')
      setCategories(Array.isArray(res.data) ? res.data : [])
    } catch (fetchError: any) {
      const status = fetchError?.response?.status
      if (status === 401) {
        setError('Session expired. Please log in again.')
        setTimeout(() => router.replace('/admin/login'), 350)
        return
      }
      if (status === 403) {
        setError('Admin access required.')
        setTimeout(() => router.replace('/admin/login'), 350)
        return
      }
      console.error('Error fetching categories:', fetchError)
      setError(handleApiError(fetchError, 'Unable to load categories.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSeedDefaults = async () => {
    if (!confirm('Restore the default category architecture? This is safe and idempotent.')) return

    setSeeding(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/api/products/admin/categories/seed/')
      await fetchCategories()
      setSuccess('Default categories restored.')
    } catch (seedError) {
      setError(handleApiError(seedError, 'Could not restore default categories.'))
    } finally {
      setSeeding(false)
    }
  }

  const resetCreateForm = () => {
    setForm({ name: '', parent: '', description: '' })
    setImageFile(null)
    setImagePreview(null)
    setImageUrl('')
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = new FormData()
      payload.append('name', form.name.trim())
      payload.append('description', form.description.trim())
      if (form.parent) payload.append('parent', form.parent)
      if (imageFile) payload.append('image', imageFile)
      if (imageUrl.trim()) payload.append('image_url', imageUrl.trim())

      const res = await api.post('/api/products/admin/categories/', payload)
      setCategories((current) => [...current, res.data])
      resetCreateForm()
      setSuccess('Category saved.')
    } catch (err) {
      setError(handleApiError(err, 'Error creating category'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return

    setError('')
    setSuccess('')

    const previous = categories
    setCategories((current) => current.filter((category) => category.id !== id))

    try {
      await api.delete(`/api/products/admin/categories/${id}/`)
      setSuccess('Category deleted.')
    } catch (deleteError) {
      console.error('Error deleting category:', deleteError)
      setCategories(previous) // rollback
      setError(handleApiError(deleteError, 'Could not delete that category. Remove or reassign children/products first.'))
    }
  }

  const handleImageSelect = (file: File | null) => {
    setImageFile(file)
    if (!file) {
      setImagePreview(null)
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCategoryImageUpload = async (category: Category, file: File | null) => {
    if (!file) return

    setUploadingId(category.id)
    setError('')
    setSuccess('')

    try {
      const payload = new FormData()
      payload.append('image', file)
      const res = await api.patch(`/api/products/admin/categories/${category.id}/`, payload)
      setCategories((current) => current.map((item) => (item.id === category.id ? res.data : item)))
      setSuccess(`Updated image for ${category.name}.`)
    } catch (uploadError) {
      console.error('Error uploading category image:', uploadError)
      setError(handleApiError(uploadError, 'Could not upload category image.'))
    } finally {
      setUploadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-amber-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-sm text-gray-500">Manage the 3-level storefront hierarchy, descriptions, and category images.</p>
        </div>
        <button
          type="button"
          onClick={handleSeedDefaults}
          disabled={seeding}
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
        >
          {seeding ? 'Restoring...' : 'Restore Default Categories'}
        </button>
      </div>

      <form onSubmit={handleAdd} className="rounded-xl bg-white p-6 shadow-md">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium text-gray-700">
            Category Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              placeholder="New category name"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-amber-500"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Parent Category
            <select
              value={form.parent}
              onChange={(e) => setForm((current) => ({ ...current, parent: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Top level</option>
              {sortedCategories.map((category) => (
                <option key={category.id} value={category.id}>{`${'-- '.repeat(category.level)}${category.name}`}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
              placeholder="Optional short description"
              className="mt-2 min-h-[52px] w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-amber-500"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Category Image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
            />
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value)
                if (e.target.value) setImageFile(null)
              }}
              placeholder="Or paste Cloudinary URL"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
            />
          </label>
        </div>

        {imagePreview && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-gray-500">Preview</p>
            <Image src={imagePreview} alt="Category preview" width={112} height={112} unoptimized className="h-28 w-28 rounded-lg object-cover" />
          </div>
        )}

        <div className="mt-4 flex items-center gap-4">
          <button type="submit" disabled={submitting} className="rounded-lg bg-amber-700 px-6 py-3 text-white transition hover:bg-amber-800 disabled:opacity-60">
            {submitting ? 'Saving...' : 'Add Category'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && success && <p className="text-sm text-emerald-600">{success}</p>}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl bg-white shadow-md">
        <table className="w-full">
          <thead className="bg-amber-700 text-white">
            <tr>
              <th className="px-6 py-4 text-left">Image</th>
              <th className="px-6 py-4 text-left">Category</th>
              <th className="px-6 py-4 text-left">SEO Path</th>
              <th className="px-6 py-4 text-left">Level</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((category, index) => (
              <tr key={category.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-gray-100">
                      {category.image ? (
                        <Image src={category.image} alt={category.name} fill className="object-cover" unoptimized={shouldUseUnoptimizedImage(category.image)} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>
                      )}
                    </div>
                    <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      {uploadingId === category.id ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={uploadingId === category.id}
                        onChange={(e) => {
                          void handleCategoryImageUpload(category, e.target.files?.[0] || null)
                          e.currentTarget.value = ''
                        }}
                      />
                    </label>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-800">{`${'-- '.repeat(category.level)}${category.name}`}</td>
                <td className="px-6 py-4 font-mono text-sm text-gray-500">/{category.full_slug}</td>
                <td className="px-6 py-4 text-sm text-gray-500">Level {category.level + 1}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
