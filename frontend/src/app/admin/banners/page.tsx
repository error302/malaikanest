'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Banner {
  id: number
  title: string
  subtitle: string
  button_text: string
  button_link: string
  image: string
  is_active: boolean
  position: number
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    button_text: '',
    button_link: '',
    image: '',
    is_active: true,
    position: 0,
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const res = await api.get('/api/products/admin/banners/')
      setBanners(res.data)
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/api/products/admin/banners/', form)
      setShowForm(false)
      setForm({ title: '', subtitle: '', button_text: '', button_link: '', image: '', is_active: true, position: 0 })
      fetchBanners()
    } catch (error) {
      console.error('Error creating banner:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this banner?')) return
    try {
      await api.delete(`/api/products/admin/banners/${id}/`)
      setBanners(banners.filter(b => b.id !== id))
    } catch (error) {
      console.error('Error deleting banner:', error)
    }
  }

  const toggleActive = async (banner: Banner) => {
    try {
      await api.patch(`/api/products/admin/banners/${banner.id}/`, { is_active: !banner.is_active })
      fetchBanners()
    } catch (error) {
      console.error('Error updating banner:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Banners</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
        >
          {showForm ? 'Cancel' : 'Add Banner'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="Subtitle"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="text"
              value={form.button_text}
              onChange={(e) => setForm({ ...form, button_text: e.target.value })}
              placeholder="Button text"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="url"
              value={form.button_link}
              onChange={(e) => setForm({ ...form, button_link: e.target.value })}
              placeholder="Button link"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="url"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="Image URL"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="number"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) })}
              placeholder="Position"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>
          <button
            type="submit"
            className="px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
          >
            Save Banner
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold text-gray-800">{banner.title || 'Untitled'}</h3>
              <p className="text-gray-500 text-sm">{banner.subtitle}</p>
              <div className="flex items-center justify-between mt-4">
                <span className={`px-2 py-1 rounded text-xs ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(banner)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    {banner.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No banners yet. Add one to get started.
        </div>
      )}
    </div>
  )
}
