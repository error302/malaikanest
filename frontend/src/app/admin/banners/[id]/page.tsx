'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import api, { clearCache, handleApiError } from '@/lib/api'
import { getImageUrl } from '@/lib/media'

interface Banner {
  id: number
  title: string
  subtitle: string
  button_text: string
  button_link: string
  image?: string | null
  image_url?: string | null
  image_full_url?: string | null
  mobile_image?: string | null
  mobile_image_url?: string | null
  mobile_image_full_url?: string | null
  is_active: boolean
  position: number
  start_date?: string | null
  end_date?: string | null
}

export default function EditBannerPage() {
  const params = useParams()
  const router = useRouter()
  const bannerId = params?.id as string

  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    const loadBanner = async () => {
      try {
        const res = await api.get(`/api/v1/products/admin/banners/${bannerId}/`)
        const banner: Banner = res.data

        setForm({
          title: banner.title || '',
          subtitle: banner.subtitle || '',
          button_text: banner.button_text || '',
          button_link: banner.button_link || '',
          is_active: Boolean(banner.is_active),
          position: Number(banner.position || 0),
          start_date: banner.start_date ? banner.start_date.slice(0, 10) : '',
          end_date: banner.end_date ? banner.end_date.slice(0, 10) : '',
        })
        setImagePreview(banner.image_full_url || getImageUrl(banner.image || banner.image_url || null))
        setMobilePreview(banner.mobile_image_full_url || getImageUrl(banner.mobile_image || banner.mobile_image_url || null))
        setImageUrl(banner.image_url || '')
        setMobileImageUrl(banner.mobile_image_url || '')
      } catch (loadError) {
        setError(handleApiError(loadError, 'Could not load this banner for editing.'))
      } finally {
        setInitialLoading(false)
      }
    }

    if (bannerId) {
      void loadBanner()
    }
  }, [bannerId])

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void
  ) => {
    const file = event.target.files?.[0] || null
    setFile(file)
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const payload = new FormData()
      payload.append('title', form.title)
      payload.append('subtitle', form.subtitle)
      payload.append('button_text', form.button_text)
      payload.append('button_link', form.button_link)
      payload.append('is_active', form.is_active ? 'true' : 'false')
      payload.append('position', String(form.position))
      payload.append('start_date', form.start_date ? `${form.start_date}T00:00:00Z` : '')
      payload.append('end_date', form.end_date ? `${form.end_date}T23:59:59Z` : '')
      payload.append('image_url', imageUrl)
      payload.append('mobile_image_url', mobileImageUrl)

      if (image) {
        payload.append('image', image)
      }
      if (mobileImage) {
        payload.append('mobile_image', mobileImage)
      }

      await api.patch(`/api/v1/products/admin/banners/${bannerId}/`, payload)
      clearCache('/api/products/banners/')
      router.push('/admin/banners')
    } catch (submitError) {
      setError(handleApiError(submitError, 'Banner changes could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  if (initialLoading) {
    return <div className="p-6">Loading banner editor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Edit Banner</h2>
          <p className="mt-1 text-slate-500">Update homepage banner content, images, and schedule.</p>
        </div>
        <Link href="/admin/banners" className="rounded-xl border px-4 py-2 text-sm text-slate-600">
          Back
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-white p-8 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border px-4 py-3" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Subtitle</label>
            <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full rounded-xl border px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Button Text</label>
            <input type="text" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} className="w-full rounded-xl border px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Button Link</label>
            <input type="text" value={form.button_link} onChange={(e) => setForm({ ...form, button_link: e.target.value })} className="w-full rounded-xl border px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Position</label>
            <input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })} className="w-full rounded-xl border px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Active</label>
            <label className="mt-3 flex items-center gap-3">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-5 w-5" />
              <span>Banner is active</span>
            </label>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Start Date</label>
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-xl border px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">End Date</label>
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-xl border px-4 py-3" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Desktop Image</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageChange(e, setImage, setImagePreview)} className="w-full rounded-xl border px-4 py-3" />
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Or paste image URL..." className="mt-2 w-full rounded-xl border px-4 py-3 text-sm" />
            {imagePreview && (
              <Image src={imagePreview} alt="Desktop banner preview" width={240} height={140} unoptimized className="mt-4 h-36 w-full rounded-xl object-cover md:w-60" />
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Mobile Image</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageChange(e, setMobileImage, setMobilePreview)} className="w-full rounded-xl border px-4 py-3" />
            <input type="url" value={mobileImageUrl} onChange={(e) => setMobileImageUrl(e.target.value)} placeholder="Or paste mobile image URL..." className="mt-2 w-full rounded-xl border px-4 py-3 text-sm" />
            {mobilePreview && (
              <Image src={mobilePreview} alt="Mobile banner preview" width={240} height={140} unoptimized className="mt-4 h-36 w-full rounded-xl object-cover md:w-60" />
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="rounded-xl bg-amber-600 px-8 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/admin/banners" className="rounded-xl bg-slate-100 px-8 py-3 font-semibold text-slate-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
