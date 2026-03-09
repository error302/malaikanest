'use client'

import { useEffect, useMemo, useState } from 'react'

import api from '@/lib/api'

interface Category {
  id: number
  name: string
  slug: string
  full_slug: string
  level: number
  parent: number | null
  description?: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    parent: '',
    description: '',
  })

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.full_slug.localeCompare(b.full_slug)),
    [categories]
  )

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/products/admin/categories/')
      setCategories(Array.isArray(res.data) ? res.data : [])
    } catch (fetchError) {
      console.error('Error fetching categories:', fetchError)
      setError('Unable to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSubmitting(true)
    setError('')
    try {
      const payload: Record<string, string | number | null> = {
        name: form.name.trim(),
        description: form.description.trim(),
        parent: form.parent ? Number(form.parent) : null,
      }
      const res = await api.post('/api/products/admin/categories/', payload)
      setCategories((current) => [...current, res.data])
      setForm({ name: '', parent: '', description: '' })
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Error creating category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return

    try {
      await api.delete(`/api/products/admin/categories/${id}/`)
      setCategories(categories.filter((category) => category.id !== id))
    } catch (deleteError) {
      console.error('Error deleting category:', deleteError)
      setError('Could not delete that category. Remove or reassign children/products first.')
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
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Categories</h1>
        <p className="text-sm text-gray-500">Manage the 3-level storefront hierarchy and SEO-ready category paths.</p>
      </div>

      <form onSubmit={handleAdd} className="rounded-xl bg-white p-6 shadow-md">
        <div className="grid gap-4 md:grid-cols-3">
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
                <option key={category.id} value={category.id}>{`${'— '.repeat(category.level)}${category.name}`}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700 md:col-span-1">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
              placeholder="Optional short description"
              className="mt-2 min-h-[52px] w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-amber-500"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button type="submit" disabled={submitting} className="rounded-lg bg-amber-700 px-6 py-3 text-white transition hover:bg-amber-800 disabled:opacity-60">
            {submitting ? 'Saving...' : 'Add Category'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl bg-white shadow-md">
        <table className="w-full">
          <thead className="bg-amber-700 text-white">
            <tr>
              <th className="px-6 py-4 text-left">Category</th>
              <th className="px-6 py-4 text-left">SEO Path</th>
              <th className="px-6 py-4 text-left">Level</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((category, index) => (
              <tr key={category.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 font-medium text-gray-800">{`${'— '.repeat(category.level)}${category.name}`}</td>
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
