'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import api, { clearCache, handleApiError } from '@/lib/api'

interface Banner {
  id: number
  title: string
  subtitle: string
  button_text: string
  button_link: string
  image: string
  mobile_image: string
  is_active: boolean
  position: number
  start_date: string
  end_date: string
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    button_text: '',
    button_link: '',
    is_active: true,
    position: 1,
    start_date: '',
    end_date: '',
  })
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mobileImage, setMobileImage] = useState<File | null>(null)
  const [mobilePreview, setMobilePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [mobileImageUrl, setMobileImageUrl] = useState('')

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setError(null)
      const res = await api.get('/api/products/admin/banners/')
      setBanners(res.data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
      setError(handleApiError(error, 'Could not load banners right now.'))
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      subtitle: '',
      button_text: '',
      button_link: '',
      is_active: true,
      position: 1,
      start_date: '',
      end_date: '',
    })
    setImage(null)
    setImagePreview(null)
    setMobileImage(null)
    setMobilePreview(null)
    setImageUrl('')
    setMobileImageUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!image && !imageUrl && !imagePreview) {
      setError('Please select or paste a desktop image.')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('subtitle', form.subtitle)
      formData.append('button_text', form.button_text)
      formData.append('button_link', form.button_link)
      formData.append('is_active', form.is_active ? 'true' : 'false')
      formData.append('position', String(form.position))

      if (form.start_date) {
        formData.append('start_date', `${form.start_date}T00:00:00Z`)
      }
      if (form.end_date) {
        formData.append('end_date', `${form.end_date}T23:59:59Z`)
      }

      // Use Cloudinary URL if provided, otherwise use file upload
      if (imageUrl) {
        formData.append('image_url', imageUrl)
      } else if (image) {
        formData.append('image', image)
      }

      if (mobileImageUrl) {
        formData.append('mobile_image_url', mobileImageUrl)
      } else if (mobileImage) {
        formData.append('mobile_image', mobileImage)
      }

      await api.post('/api/products/admin/banners/', formData)
      clearCache('/api/products/banners/')
      setShowForm(false)
      resetForm()
      setSuccess('Banner saved successfully.')
      await fetchBanners()
    } catch (error) {
      console.error('Error creating banner:', error)
      setError(handleApiError(error, 'Banner could not be saved. Please review the fields and try again.'))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this banner?')) return
    setError(null)
    setSuccess(null)

    try {
      await api.delete(`/api/products/admin/banners/${id}/`)
      clearCache('/api/products/banners/')
      setBanners((current) => current.filter((banner) => banner.id !== id))
      setSuccess('Banner deleted.')
    } catch (error) {
      console.error('Error deleting banner:', error)
      setError(handleApiError(error, 'Banner could not be deleted.'))
    }
  }

  const toggleActive = async (banner: Banner) => {
    setError(null)
    setSuccess(null)

    try {
      await api.patch(`/api/products/admin/banners/${banner.id}/`, { is_active: !banner.is_active })
      clearCache('/api/products/banners/')
      setSuccess(`Banner ${banner.is_active ? 'disabled' : 'enabled'}.`)
      await fetchBanners()
    } catch (error) {
      console.error('Error updating banner:', error)
      setError(handleApiError(error, 'Banner status could not be updated.'))
    }
  }

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void
  ) => {
    const file = e.target.files?.[0] || null
    setFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Banners</h2>
          <p className="text-slate-500 mt-1">Manage your homepage banners</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setError(null)
            setSuccess(null)
          }}
          className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700"
        >
          {showForm ? 'Cancel' : 'Add Banner'}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Welcome to Malaika Nest" className="w-full px-4 py-3 rounded-xl border" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Subtitle</label>
              <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Premium Baby Products" className="w-full px-4 py-3 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Button Text</label>
              <input type="text" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} placeholder="Shop Now" className="w-full px-4 py-3 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Button Link</label>
              <input type="text" value={form.button_link} onChange={(e) => setForm({ ...form, button_link: e.target.value })} placeholder="/categories" className="w-full px-4 py-3 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Position</label>
              <input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Active</label>
              <label className="flex items-center gap-3 mt-3">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5" />
                <span>Banner is active</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Desktop Image * (File or URL)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp,video/*" onChange={(e) => handleImageChange(e, setImage, setImagePreview)} className="w-full px-4 py-3 rounded-xl border" />
              <div className="mt-2">
                <input 
                  type="url" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste Cloudinary URL here..."
                  className="w-full px-4 py-2 rounded-xl border text-sm" 
                />
              </div>
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={192}
                  height={128}
                  unoptimized
                  className="mt-4 h-32 w-48 rounded-lg object-cover"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mobile Image (optional)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp,video/*" onChange={(e) => handleImageChange(e, setMobileImage, setMobilePreview)} className="w-full px-4 py-3 rounded-xl border" />
              <div className="mt-2">
                <input 
                  type="url" 
                  value={mobileImageUrl}
                  onChange={(e) => setMobileImageUrl(e.target.value)}
                  placeholder="Or paste Cloudinary URL..."
                  className="w-full px-4 py-2 rounded-xl border text-sm" 
                />
              </div>
              {mobilePreview && (
                <Image
                  src={mobilePreview}
                  alt="Preview"
                  width={192}
                  height={128}
                  unoptimized
                  className="mt-4 h-32 w-48 rounded-lg object-cover"
                />
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={uploading} className="px-8 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-50">
              {uploading ? 'Saving...' : 'Save Banner'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setError(null)
                setSuccess(null)
              }}
              className="px-8 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {banners.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <p className="text-slate-600">No banners yet</p>
          <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-3 bg-amber-600 text-white rounded-xl">Create First Banner</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-2xl overflow-hidden border hover:shadow-md">
              <div className="relative h-48 bg-slate-100">
                {banner.image ? (
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                )}
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${banner.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold">{banner.title || 'Untitled'}</h3>
                <p className="text-slate-500 text-sm">{banner.subtitle}</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => toggleActive(banner)} className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-sm">{banner.is_active ? 'Disable' : 'Enable'}</button>
                  <button onClick={() => handleDelete(banner.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
