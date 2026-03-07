'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
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
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', subtitle: '', button_text: '', button_link: '', is_active: true, position: 0 })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => { fetchBanners() }, [])

  const fetchBanners = async () => {
    try {
      const res = await api.get('/api/products/admin/banners/')
      const data = Array.isArray(res.data) ? res.data : res.data?.results || []
      setBanners(data)
    } catch (error) {
      console.error('Error fetching banners:', error)
      setBanners([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    try {
      const body = new FormData()
      body.append('title', form.title)
      body.append('subtitle', form.subtitle)
      body.append('button_text', form.button_text)
      body.append('button_link', form.button_link)
      body.append('is_active', form.is_active ? 'true' : 'false')
      body.append('position', String(form.position))
      body.append('image', file)

      await api.post('/api/products/admin/banners/', body, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm({ title: '', subtitle: '', button_text: '', button_link: '', is_active: true, position: 0 })
      setFile(null)
      await fetchBanners()
    } catch (error) {
      console.error('Error creating banner:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this banner?')) return
    try {
      await api.delete(`/api/products/admin/banners/${id}/`)
      setBanners(banners.filter((b) => b.id !== id))
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

  if (loading) return <div className="p-6">Loading banners...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Banners</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="px-4 py-3 border rounded-lg" />
          <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Subtitle" className="px-4 py-3 border rounded-lg" />
          <input value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} placeholder="Button text" className="px-4 py-3 border rounded-lg" />
          <input value={form.button_link} onChange={(e) => setForm({ ...form, button_link: e.target.value })} placeholder="Button link" className="px-4 py-3 border rounded-lg" />
          <input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} placeholder="Position" className="px-4 py-3 border rounded-lg" />
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        </div>

        <div className="border-2 border-dashed rounded-xl p-6">
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <button type="submit" disabled={uploading || !file} className="px-6 py-3 bg-amber-700 text-white rounded-lg disabled:opacity-50">
          {uploading ? 'Uploading...' : 'Upload Banner'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="relative w-full h-48">
              <Image src={banner.image} alt={banner.title || 'Banner'} fill className="object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-800">{banner.title || 'Untitled'}</h3>
              <p className="text-gray-500 text-sm">{banner.subtitle}</p>
              <div className="flex items-center justify-between mt-4">
                <span className={`px-2 py-1 rounded text-xs ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{banner.is_active ? 'Active' : 'Inactive'}</span>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(banner)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">{banner.is_active ? 'Disable' : 'Enable'}</button>
                  <button onClick={() => handleDelete(banner.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length === 0 && <div className="text-center py-12 text-gray-500">No banners yet.</div>}
    </div>
  )
}