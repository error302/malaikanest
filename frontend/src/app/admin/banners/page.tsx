'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, Eye, EyeOff, X, Save } from 'lucide-react';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/media';
import { showToast } from '@/lib/toast';

interface Banner {
  id: number;
  title?: string;
  subtitle?: string;
  image?: string | null;
  image_url?: string | null;
  mobile_image?: string | null;
  mobile_image_url?: string | null;
  button_text?: string;
  button_link?: string;
  is_active: boolean;
  position?: number;
}

const initialForm = {
  title: '',
  subtitle: '',
  image_url: '',
  mobile_image_url: '',
  button_text: '',
  button_link: '',
  is_active: true,
  position: 0,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mobileImagePreview, setMobileImagePreview] = useState<string | null>(null);

  const fetchBanners = () => {
    setLoading(true);
    api.get('/api/v1/products/banners/')
      .then((res) => {
        const data = res.data;
        setBanners(data?.results ?? data?.data?.results ?? []);
      })
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setImagePreview(null);
    setMobileImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image_url: banner.image_url || '',
      mobile_image_url: banner.mobile_image_url || '',
      button_text: banner.button_text || '',
      button_link: banner.button_link || '',
      is_active: banner.is_active,
      position: banner.position || 0,
    });
    setImagePreview(banner.image_url || banner.image || null);
    setMobileImagePreview(banner.mobile_image_url || banner.mobile_image || null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(initialForm);
    setImagePreview(null);
    setMobileImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/api/v1/products/banners/${editing.id}/`, form);
        setBanners((b) => b.map((x) => x.id === editing.id ? { ...x, ...form } : x));
        showToast('Banner updated', 'success');
      } else {
        const res = await api.post('/api/v1/products/banners/', form);
        const newBanner = res.data?.data ?? res.data;
        setBanners((b) => [newBanner, ...b]);
        showToast('Banner created', 'success');
      }
      closeModal();
    } catch {
      showToast('Failed to save banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await api.patch(`/api/v1/products/banners/${banner.id}/`, { is_active: !banner.is_active });
      setBanners((b) => b.map((x) => x.id === banner.id ? { ...x, is_active: !x.is_active } : x));
      showToast(banner.is_active ? 'Banner hidden' : 'Banner activated', 'success');
    } catch {
      showToast('Failed to update banner', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await api.delete(`/api/v1/products/banners/${id}/`);
      setBanners((b) => b.filter((x) => x.id !== id));
      showToast('Banner deleted', 'success');
    } catch {
      showToast('Failed to delete banner', 'error');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              Homepage Banners
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
              Manage the hero carousel slides
            </p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            <Plus size={16} /> Add Banner
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
          ) : banners.length === 0 ? (
            <div className="col-span-full p-8 text-center">
              <ImageIcon size={32} className="mx-auto mb-3" style={{ color: 'var(--brand-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>No banners yet. Add your first hero slide.</p>
            </div>
          ) : (
            banners.map((b) => (
              <div key={b.id} className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
                <div className="aspect-video relative" style={{ background: 'var(--brand-warm)' }}>
                  {(b.image_url || b.image) ? (
                    <img src={getImageUrl(b.image_url || b.image)} alt={b.title || 'Banner'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={28} style={{ color: 'var(--brand-text-muted)' }} />
                    </div>
                  )}
                  <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full" style={{ background: b.is_active ? 'rgba(45,90,66,0.9)' : 'rgba(196,112,74,0.9)', color: '#FFFFFF' }}>
                    {b.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="text-sm font-semibold mb-1 truncate" style={{ color: 'var(--brand-text)' }}>{b.title || 'Untitled banner'}</div>
                  {b.subtitle && <div className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--brand-text-muted)' }}>{b.subtitle}</div>}
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={() => toggleActive(b)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
                      {b.is_active ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                    </button>
                    <button type="button" onClick={() => openEdit(b)} className="w-9 h-9 inline-flex items-center justify-center rounded-lg border" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }} aria-label="Edit banner">
                      <Save size={14} />
                    </button>
                    <button type="button" onClick={() => handleDelete(b.id)} className="w-9 h-9 inline-flex items-center justify-center rounded-lg border" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-terra)' }} aria-label="Delete banner">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(44, 24, 16, 0.5)' }} onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-warm-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--brand-border)' }}>
              <h2 className="font-serif text-xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
                {editing ? 'Edit Banner' : 'Add Banner'}
              </h2>
              <button type="button" onClick={closeModal} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--brand-warm)]" style={{ color: 'var(--brand-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Hero headline" className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Subtitle</label>
                <textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Supporting text" rows={2} className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Desktop Image URL (Cloudinary or any https URL)</label>
                <div className="space-y-2">
                  <input value={form.image_url} onChange={(e) => { setForm({ ...form, image_url: e.target.value }); setImagePreview(e.target.value || null); }} placeholder="https://res.cloudinary.com/.../image.jpg" className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
                  {imagePreview && (
                    <div className="w-48 h-24 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--brand-border)' }}>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Mobile Image URL (optional)</label>
                <div className="space-y-2">
                  <input value={form.mobile_image_url} onChange={(e) => { setForm({ ...form, mobile_image_url: e.target.value }); setMobileImagePreview(e.target.value || null); }} placeholder="https://res.cloudinary.com/.../mobile.jpg" className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
                  {mobileImagePreview && (
                    <div className="w-24 h-32 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--brand-border)' }}>
                      <img src={mobileImagePreview} alt="Mobile preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>CTA Button Text</label>
                  <input value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} placeholder="Shop Now" className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>CTA Button Link</label>
                  <input value={form.button_link} onChange={(e) => setForm({ ...form, button_link: e.target.value })} placeholder="/categories or https://..." className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Position (order)</label>
                  <input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 0 })} className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-brown)' }}>
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                    Active / Visible
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
                  {saving ? 'Saving…' : <> <Save size={16} /> {editing ? 'Update' : 'Create'} Banner</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}