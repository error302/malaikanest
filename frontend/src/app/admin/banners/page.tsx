'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Eye, EyeOff, ImageIcon } from 'lucide-react'
import api, { clearCache, handleApiError } from '@/lib/api'
import { getImageUrl } from '@/lib/media'

interface Banner {
  id: number
  title: string
  subtitle: string
  button_text: string
  button_link: string
  image: string
  image_url?: string
  image_full_url?: string
  mobile_image: string
  mobile_image_url?: string
  mobile_image_full_url?: string
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

    const previous = banners
    setBanners((current) => current.filter((banner) => banner.id !== id))

    try {
      await api.delete(`/api/products/admin/banners/${id}/`)
      clearCache('/api/products/banners/')
      setSuccess('Banner deleted.')
    } catch (error) {
      console.error('Error deleting banner:', error)
      setBanners(previous)
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
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-[#E8D5B5] border-t-[#8B6914] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#2C1810] font-serif">Banners</h2>
          <p className="text-[#8A7060] mt-1">Manage your homepage hero banners</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setError(null)
            setSuccess(null)
          }}
          className="px-6 py-3 bg-[#8B6914] text-white font-semibold rounded-xl hover:bg-[#6B5310] transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
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
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-warm-sm border border-[#E8E0D5] p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#2C1810] mb-2">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Welcome to Malaika Nest" className="w-full px-4 py-3 rounded-xl border border-[#E8E0D5] focus:outline-none focus:border-[#8B6914] transition-colors" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2C1810] mb-2">Subtitle</label>
              <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Premium Baby Products" className="w-full px-4 py-3 rounded-xl border border-[#E8E0D5] focus:outline-none focus:border-[#8B6914] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2C1810] mb-2">Button Text</label>
              <input type="text" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} placeholder="Shop Now" className="w-full px-4 py-3 rounded-xl border border-[#E8E0D5] focus:outline-none focus:border-[#8B6914] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2C1810] mb-2">Button Link</label>
              <input type="text" value={form.button_link} onChange={(e) => setForm({ ...form, button_link: e.target.value })} placeholder="/categories" className="w-full px-4 py-3 rounded-xl border border-[#E8E0D5] focus:outline-none focus:border-[#8B6914] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2C1810] mb-2">Position</label>
              <input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl border border-[#E8E0D5] focus:outline-none focus:border-[#8B6914] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2C1810] mb-2">Active</label>
              <label className="flex items-center gap-3 mt-3">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5 accent-[#8B6914]" />
                <span className="text-[#5C4033]">Banner is active</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2C1810] mb-2">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#E8E0D5] focus:outline-none focus:border-[#8B6914] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2C1810] mb-2">End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#E8E0D5] focus:outline-none focus:border-[#8B6914] transition-colors" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#2C1810] mb-2">Desktop Image * (File or URL)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp,video/*" onChange={(e) => handleImageChange(e, setImage, setImagePreview)} className="w-full px-4 py-3 rounded-xl border border-[#E8E0D5]" />
              <div className="mt-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste Cloudinary URL here..."
                  className="w-full px-4 py-2 rounded-xl border border-[#E8E0D5] text-sm focus:outline-none focus:border-[#8B6914]"
                />
              </div>
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={192}
                  height={128}
                  unoptimized
                  className="mt-4 h-32 w-48 rounded-lg object-cover border border-[#E8E0D5]"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2C1810] mb-2">Mobile Image (optional)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp,video/*" onChange={(e) => handleImageChange(e, setMobileImage, setMobilePreview)} className="w-full px-4 py-3 rounded-xl border border-[#E8E0D5]" />
              <div className="mt-2">
                <input
                  type="url"
                  value={mobileImageUrl}
                  onChange={(e) => setMobileImageUrl(e.target.value)}
                  placeholder="Or paste Cloudinary URL..."
                  className="w-full px-4 py-2 rounded-xl border border-[#E8E0D5] text-sm focus:outline-none focus:border-[#8B6914]"
                />
              </div>
              {mobilePreview && (
                <Image
                  src={mobilePreview}
                  alt="Preview"
                  width={192}
                  height={128}
                  unoptimized
                  className="mt-4 h-32 w-48 rounded-lg object-cover border border-[#E8E0D5]"
                />
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={uploading} className="px-8 py-3 bg-[#8B6914] text-white font-semibold rounded-xl hover:bg-[#6B5310] disabled:opacity-50 transition-colors">
              {uploading ? 'Saving...' : 'Save Banner'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setError(null)
                setSuccess(null)
              }}
              className="px-8 py-3 bg-[#F5EFE6] text-[#5C4033] font-semibold rounded-xl hover:bg-[#E8E0D5] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {banners.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E0D5]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5EFE6] flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-[#C9A96E]" />
          </div>
          <p className="text-[#5C4033] font-medium">No banners yet</p>
          <p className="text-sm text-[#8A7060] mt-1 mb-4">Create your first banner to display on the homepage</p>
          <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-[#8B6914] text-white rounded-xl hover:bg-[#6B5310] transition-colors">
            Create First Banner
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-2xl overflow-hidden border border-[#E8E0D5] hover:shadow-warm-md transition-all group">
              <div className="relative h-48 bg-[#F5EFE6]">
                {(() => {
                  const src =
                    banner.image_full_url ||
                    getImageUrl(banner.image || banner.image_url || null)

                  return src ? (
                    <Image
                      src={src}
                      alt={banner.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8A7060]">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )
                })()}
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${banner.is_active ? 'bg-[#8B6914] text-white' : 'bg-[#8A7060] text-white'}`}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[#2C1810]">{banner.title || 'Untitled'}</h3>
                <p className="text-[#8A7060] text-sm line-clamp-2">{banner.subtitle}</p>
                <div className="flex gap-2 mt-4">
                  <Link href={`/admin/banners/${banner.id}`} className="flex-1 px-3 py-2 bg-[#F5EFE6] text-[#8B6914] rounded-lg text-center text-sm font-medium hover:bg-[#E8D5B5] transition-colors flex items-center justify-center gap-1">
                    <Pencil className="w-4 h-4" /> Edit
                  </Link>
                  <button onClick={() => toggleActive(banner)} className="flex-1 px-3 py-2 bg-[#F5EFE6] text-[#5C4033] rounded-lg text-sm font-medium hover:bg-[#E8E0D5] transition-colors flex items-center justify-center gap-1">
                    {banner.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {banner.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(banner.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
