'use client';

import { useEffect, useState, useRef, type RefObject } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { BrandingLogoFavicon } from '@/components/admin/branding/BrandingLogoFavicon';
import { BrandingStoreIdentity } from '@/components/admin/branding/BrandingStoreIdentity';
import { BrandingColors } from '@/components/admin/branding/BrandingColors';
import { BrandingAnnouncements } from '@/components/admin/branding/BrandingAnnouncements';
import { BrandingContactSocial } from '@/components/admin/branding/BrandingContactSocial';
import { BrandingLocationMap } from '@/components/admin/branding/BrandingLocationMap';
import { BrandingBusinessHours } from '@/components/admin/branding/BrandingBusinessHours';

export default function AdminBrandingPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [hours, setHours] = useState<Array<{ day: string; hours: string }>>([]);

  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/branding')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings || {});
        try {
          setAnnouncements(JSON.parse(data.settings?.announcement_messages || '[]'));
        } catch { setAnnouncements([]); }
        try {
          const parsed = JSON.parse(data.settings?.business_hours || '[]');
          setHours(Array.isArray(parsed) ? parsed : []);
        } catch { setHours([]); }
      })
      .catch(() => showToast('Failed to load branding', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: string) => setSettings((s) => ({ ...s, [key]: value }));

  const updateAnnouncement = (i: number, value: string) => {
    setAnnouncements((a) => a.map((msg, idx) => (idx === i ? value : msg)));
  };
  const addAnnouncement = () => setAnnouncements((a) => [...a, 'New announcement message']);
  const removeAnnouncement = (i: number) => setAnnouncements((a) => a.filter((_, idx) => idx !== i));

  const updateHour = (i: number, field: 'day' | 'hours', value: string) => {
    setHours((h) => h.map((entry, idx) => (idx === i ? { ...entry, [field]: value } : entry)));
  };
  const addHour = () => setHours((h) => [...h, { day: 'New day', hours: '9:00 AM – 5:00 PM' }]);
  const removeHour = (i: number) => setHours((h) => h.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...settings, announcement_messages: JSON.stringify(announcements), business_hours: JSON.stringify(hours) };
      const res = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      showToast('Branding saved — changes are live', 'success');
    } catch {
      showToast('Failed to save branding', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (key: 'logo_url' | 'favicon_url', fileRef: RefObject<HTMLInputElement | null>) => {
    const input = fileRef.current;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/branding/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      update(key, data.url);
      showToast('Image uploaded — remember to Save All Changes', 'success');
    } catch (e: any) {
      showToast(e.message || 'Upload failed', 'error');
    } finally {
      if (input) input.value = '';
    }
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Branding & Identity
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
          Change your logo, favicon, store name and announcement bar — no code needed.
        </p>
      </div>

      <BrandingLogoFavicon
        logoUrl={settings.logo_url || ''}
        faviconUrl={settings.favicon_url || ''}
        logoFileRef={logoFileRef}
        faviconFileRef={faviconFileRef}
        onUpdate={update}
        onUpload={handleUpload}
      />

      <BrandingStoreIdentity
        storeName={settings.store_name || ''}
        tagline={settings.tagline || ''}
        footerTagline={settings.footer_tagline || ''}
        onUpdate={update}
      />

      <BrandingColors
        primaryColor={settings.primary_color || ''}
        accentColor={settings.accent_color || ''}
        onUpdate={update}
      />

      <BrandingAnnouncements
        announcements={announcements}
        onAdd={addAnnouncement}
        onUpdate={updateAnnouncement}
        onRemove={removeAnnouncement}
      />

      <BrandingContactSocial
        settings={settings}
        onUpdate={update}
      />

      <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving…' : 'Save All Changes'}
      </button>

      <BrandingLocationMap
        settings={settings}
        onUpdate={update}
      />

      <BrandingBusinessHours
        hours={hours}
        onAdd={addHour}
        onUpdate={updateHour}
        onRemove={removeHour}
      />

      <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving…' : 'Save All Changes'}
      </button>
    </div>
  );
}
