'use client';

import { useEffect, useState, useRef, type RefObject } from 'react';
import { Save, Upload, Image as ImageIcon, Palette, MessageCircle, Phone, Globe, MapPin, Clock, Plus, X } from 'lucide-react';
import { showToast } from '@/lib/toast';

const LUCIDE_ICONS = ['Baby', 'Heart', 'Star', 'ShoppingCart', 'Sparkles', 'Gift', 'Shield', 'Truck', 'CreditCard', 'Smile'];

export default function AdminBrandingPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [hours, setHours] = useState<Array<{ day: string; hours: string }>>([]);

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

  const updateHour = (i: number, field: 'day' | 'hours', value: string) => {
    setHours((h) => h.map((entry, idx) => (idx === i ? { ...entry, [field]: value } : entry)));
  };
  const addHour = () => setHours((h) => [...h, { day: 'New day', hours: '9:00 AM – 5:00 PM' }]);
  const removeHour = (i: number) => setHours((h) => h.filter((_, idx) => idx !== i));

  const inputClass = 'w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none';
  const inputStyle = { background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' };

  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

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

      {/* Logo & Favicon */}
      <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={18} style={{ color: 'var(--brand-gold)' }} />
          <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Logo & Favicon</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Logo URL</label>
            <div className="flex gap-2">
              <input value={settings.logo_url || ''} onChange={(e) => update('logo_url', e.target.value)} placeholder="https://res.cloudinary.com/…/logo.png (leave empty for built-in SVG)" className={inputClass} style={inputStyle} />
              <button type="button" onClick={() => logoFileRef.current?.click()} className="px-3 rounded-xl text-sm font-medium flex-shrink-0" style={{ background: 'var(--brand-warm)', color: 'var(--brand-gold)' }}>Upload</button>
              <input ref={logoFileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={() => handleUpload('logo_url', logoFileRef)} />
            </div>
            {settings.logo_url && (
              <div className="mt-2 inline-block p-2 rounded-xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
                <img src={settings.logo_url} alt="Logo preview" className="h-12 w-auto object-contain" />
              </div>
            )}
            <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>Upload a file or paste a Cloudinary/CDN URL. Leave empty to use the built-in swaddle-baby SVG logo.</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Favicon URL</label>
            <div className="flex gap-2">
              <input value={settings.favicon_url || ''} onChange={(e) => update('favicon_url', e.target.value)} placeholder="https://res.cloudinary.com/…/favicon.ico (leave empty for /logo.svg)" className={inputClass} style={inputStyle} />
              <button type="button" onClick={() => faviconFileRef.current?.click()} className="px-3 rounded-xl text-sm font-medium flex-shrink-0" style={{ background: 'var(--brand-warm)', color: 'var(--brand-gold)' }}>Upload</button>
              <input ref={faviconFileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,.ico" className="hidden" onChange={() => handleUpload('favicon_url', faviconFileRef)} />
            </div>
          </div>
        </div>
      </div>

      {/* Store Identity */}
      <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} style={{ color: 'var(--brand-gold)' }} />
          <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Store Identity</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Store name</label>
            <input value={settings.store_name || ''} onChange={(e) => update('store_name', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Tagline</label>
            <input value={settings.tagline || ''} onChange={(e) => update('tagline', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Footer tagline</label>
            <textarea value={settings.footer_tagline || ''} onChange={(e) => update('footer_tagline', e.target.value)} rows={2} className={inputClass} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Palette size={18} style={{ color: 'var(--brand-gold)' }} />
          <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Brand Colors</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Primary (gold)</label>
            <div className="flex gap-2">
              <input type="color" value={settings.primary_color || '#8B6914'} onChange={(e) => update('primary_color', e.target.value)} className="w-12 h-10 rounded-lg border" style={{ borderColor: 'var(--brand-border)' }} />
              <input value={settings.primary_color || ''} onChange={(e) => update('primary_color', e.target.value)} className={inputClass} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Accent (terracotta)</label>
            <div className="flex gap-2">
              <input type="color" value={settings.accent_color || '#C4704A'} onChange={(e) => update('accent_color', e.target.value)} className="w-12 h-10 rounded-lg border" style={{ borderColor: 'var(--brand-border)' }} />
              <input value={settings.accent_color || ''} onChange={(e) => update('accent_color', e.target.value)} className={inputClass} style={inputStyle} />
            </div>
          </div>
        </div>
        <p className="text-[11px] mt-2" style={{ color: 'var(--brand-text-muted)' }}>Note: color changes apply to new visitors after cache refresh (~60s).</p>
      </div>

      {/* Announcement Bar */}
      <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} style={{ color: 'var(--brand-gold)' }} />
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Announcement Bar</h2>
          </div>
          <button type="button" onClick={addAnnouncement} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'var(--brand-warm)', color: 'var(--brand-gold)' }}>+ Add message</button>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--brand-text-muted)' }}>Messages rotate every 4.5s in the top bar. HTML allowed (e.g. &lt;strong&gt;).</p>
        <div className="space-y-2">
          {announcements.map((msg, i) => (
            <div key={i} className="flex gap-2">
              <input value={msg} onChange={(e) => updateAnnouncement(i, e.target.value)} className={inputClass} style={inputStyle} />
              <button type="button" onClick={() => removeAnnouncement(i)} className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center" style={{ background: 'rgba(196,112,74,0.1)', color: 'var(--brand-terra)' }} aria-label="Remove message">×</button>
            </div>
          ))}
          {announcements.length === 0 && <p className="text-xs italic" style={{ color: 'var(--brand-text-muted)' }}>No messages — bar will be hidden.</p>}
        </div>
      </div>

      {/* Contact */}
      <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Phone size={18} style={{ color: 'var(--brand-gold)' }} />
          <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Contact & Social</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Contact email</label>
            <input value={settings.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Contact phone</label>
            <input value={settings.contact_phone || ''} onChange={(e) => update('contact_phone', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>M-Pesa Till</label>
            <input value={settings.mpesa_till || ''} onChange={(e) => update('mpesa_till', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Location</label>
            <input value={settings.location || ''} onChange={(e) => update('location', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>WhatsApp URL</label>
            <input value={settings.whatsapp_url || ''} onChange={(e) => update('whatsapp_url', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Facebook URL</label>
            <input value={settings.facebook_url || ''} onChange={(e) => update('facebook_url', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Instagram URL</label>
            <input value={settings.instagram_url || ''} onChange={(e) => update('instagram_url', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Copyright name</label>
            <input value={settings.copyright_name || ''} onChange={(e) => update('copyright_name', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
        </div>
      </div>

      <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
        <Save size={16} /> {saving ? 'Saving…' : 'Save All Changes'}
      </button>

      {/* Location & Map */}
      <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} style={{ color: 'var(--brand-gold)' }} />
          <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Find Us Page — Location & Map</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Address (displayed on Find Us page)</label>
            <input value={settings.address_line || ''} onChange={(e) => update('address_line', e.target.value)} placeholder="e.g. Nyali Road, Mombasa, Kenya" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Directions / notes</label>
            <textarea value={settings.address_directions || ''} onChange={(e) => update('address_directions', e.target.value)} rows={2} placeholder="Visit our workshop in Mombasa for in-person shopping and pickups. Call ahead to ensure we're in!" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Google Maps embed URL</label>
            <input value={settings.map_embed_url || ''} onChange={(e) => update('map_embed_url', e.target.value)} placeholder="https://www.google.com/maps?q=...&output=embed" className={inputClass} style={inputStyle} />
            <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>
              To get a custom embed: go to <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline">Google Maps</a>, search your address, click Share → Embed a map → copy the <code>src</code> URL. Or use the simple format: <code>https://www.google.com/maps?q=YOUR_ADDRESS&output=embed</code>
            </p>
          </div>
          {settings.map_embed_url && (
            <div className="mt-2 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--brand-border)' }}>
              <iframe src={settings.map_embed_url} width="100%" height="200" style={{ border: 0, display: 'block' }} loading="lazy" title="Map preview" />
            </div>
          )}
        </div>
      </div>

      {/* Business Hours */}
      <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} style={{ color: 'var(--brand-gold)' }} />
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Business Hours</h2>
          </div>
          <button type="button" onClick={addHour} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'var(--brand-warm)', color: 'var(--brand-gold)' }}>
            <Plus size={12} className="inline" /> Add row
          </button>
        </div>
        <div className="space-y-2">
          {hours.map((entry, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={entry.day} onChange={(e) => updateHour(i, 'day', e.target.value)} placeholder="Day" className={`${inputClass} flex-1`} style={inputStyle} />
              <input value={entry.hours} onChange={(e) => updateHour(i, 'hours', e.target.value)} placeholder="Hours" className={`${inputClass} flex-1`} style={inputStyle} />
              <button type="button" onClick={() => removeHour(i)} className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center" style={{ background: 'rgba(196,112,74,0.1)', color: 'var(--brand-terra)' }} aria-label="Remove row">
                <X size={16} />
              </button>
            </div>
          ))}
          {hours.length === 0 && <p className="text-xs italic" style={{ color: 'var(--brand-text-muted)' }}>No hours set — add at least one row.</p>}
        </div>
      </div>

      <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
        <Save size={16} /> {saving ? 'Saving…' : 'Save All Changes'}
      </button>
    </div>
  );
}
