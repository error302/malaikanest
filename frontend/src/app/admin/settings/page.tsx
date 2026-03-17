'use client'

import { useEffect, useMemo, useState } from 'react'

import api, { handleApiError } from '@/lib/api'
import { showToast } from '@/components/Toast'

type TabId = 'general' | 'store' | 'payments' | 'security'

type SiteSettings = {
  site_name: string
  site_description: string
  contact_email: string
  contact_phone: string
  address: string
  facebook_url: string
  instagram_url: string
  twitter_url: string
  shipping_fee: string | number
  free_shipping_threshold: string | number
  minimum_order_amount: string | number
  logo_url?: string | null
}

const DEFAULTS: SiteSettings = {
  site_name: 'Malaika Nest',
  site_description: 'Premium Baby Products in Kenya',
  contact_email: 'malaikanest7@gmail.com',
  contact_phone: '+254700000000',
  address: 'Nairobi, Kenya',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
  shipping_fee: 500,
  free_shipping_threshold: 5000,
  minimum_order_amount: 1000,
  logo_url: null,
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const logoPreview = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile)
    return settings.logo_url || null
  }, [logoFile, settings.logo_url])

  useEffect(() => {
    return () => {
      if (logoPreview && logoFile) URL.revokeObjectURL(logoPreview)
    }
  }, [logoFile, logoPreview])

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    setSessionExpired(false)

    api
      .get('/api/core/settings/')
      .then((res) => {
        if (!mounted) return
        setSettings({ ...DEFAULTS, ...res.data })
      })
      .catch((err) => {
        if (!mounted) return
        if (err?.response?.status === 401) {
          setSessionExpired(true)
          return
        }
        showToast(handleApiError(err, 'Unable to load settings.'), 'error')
      })
      .finally(() => mounted && setIsLoading(false))

    return () => {
      mounted = false
    }
  }, [])

  const update = (patch: Partial<SiteSettings>) => setSettings((prev) => ({ ...prev, ...patch }))

  const save = async () => {
    setIsSaving(true)
    setSessionExpired(false)

    try {
      const form = new FormData()
      form.append('site_name', settings.site_name || '')
      form.append('site_description', settings.site_description || '')
      form.append('contact_email', settings.contact_email || '')
      form.append('contact_phone', settings.contact_phone || '')
      form.append('address', settings.address || '')
      form.append('facebook_url', settings.facebook_url || '')
      form.append('instagram_url', settings.instagram_url || '')
      form.append('twitter_url', settings.twitter_url || '')
      form.append('shipping_fee', String(settings.shipping_fee ?? ''))
      form.append('free_shipping_threshold', String(settings.free_shipping_threshold ?? ''))
      form.append('minimum_order_amount', String(settings.minimum_order_amount ?? ''))
      if (logoFile) form.append('logo', logoFile)

      const res = await api.patch('/api/core/settings/', form)
      setSettings({ ...DEFAULTS, ...res.data })
      setLogoFile(null)
      showToast('Settings saved.', 'success')
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setSessionExpired(true)
        showToast('Session expired. Please log in again.', 'error')
        return
      }
      showToast(handleApiError(err, 'Failed to save settings.'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass =
    'w-full bg-white text-slate-900 placeholder-slate-400 px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all'

  const tabs = [
    { id: 'general' as const, label: 'General' },
    { id: 'store' as const, label: 'Store' },
    { id: 'payments' as const, label: 'Payments' },
    { id: 'security' as const, label: 'Security' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your store settings and preferences</p>
      </div>

      {sessionExpired && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">
          Session expired. Please log in again.
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-64 lg:shrink-0">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-amber-50 text-amber-800' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            {isLoading ? (
              <div className="text-sm text-slate-500">Loading settings...</div>
            ) : (
              <>
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-800">General Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Store Name</label>
                        <input value={settings.site_name} onChange={(e) => update({ site_name: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Support Email</label>
                        <input value={settings.contact_email} onChange={(e) => update({ contact_email: e.target.value })} className={inputClass} type="email" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                        <input value={settings.contact_phone} onChange={(e) => update({ contact_phone: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                        <input value={settings.address} onChange={(e) => update({ address: e.target.value })} className={inputClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Site Description</label>
                        <input value={settings.site_description} onChange={(e) => update({ site_description: e.target.value })} className={inputClass} />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={save}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-600/20 disabled:opacity-60"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'store' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-800">Store Branding</h3>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Website Logo</label>
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            {logoPreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                            ) : (
                              <div className="h-full w-full bg-slate-50" />
                            )}
                          </div>
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-800 hover:file:bg-amber-100"
                            />
                            <p className="mt-2 text-xs text-slate-500">PNG or JPG recommended. Used in the navbar and footer.</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Social Links</label>
                        <div className="space-y-3">
                          <input placeholder="Facebook URL" value={settings.facebook_url} onChange={(e) => update({ facebook_url: e.target.value })} className={inputClass} />
                          <input placeholder="Instagram URL" value={settings.instagram_url} onChange={(e) => update({ instagram_url: e.target.value })} className={inputClass} />
                          <input placeholder="Twitter/X URL" value={settings.twitter_url} onChange={(e) => update({ twitter_url: e.target.value })} className={inputClass} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={save}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-600/20 disabled:opacity-60"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-800">Checkout Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Shipping Fee (KES)</label>
                        <input value={String(settings.shipping_fee)} onChange={(e) => update({ shipping_fee: e.target.value })} className={inputClass} inputMode="decimal" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Free Shipping Threshold</label>
                        <input value={String(settings.free_shipping_threshold)} onChange={(e) => update({ free_shipping_threshold: e.target.value })} className={inputClass} inputMode="decimal" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Minimum Order Amount</label>
                        <input value={String(settings.minimum_order_amount)} onChange={(e) => update({ minimum_order_amount: e.target.value })} className={inputClass} inputMode="decimal" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={save}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-600/20 disabled:opacity-60"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-800">Security</h3>
                    <p className="text-sm text-slate-500">
                      Admin security settings are managed on the server. (This section is UI-only for now.)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
