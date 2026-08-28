'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/media';
import { showToast } from '@/lib/toast';

interface Banner {
  id: string | number;
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

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

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
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/api/v1/products/banners/');
        if (cancelled) return;
        const data = res.data;
        setBanners(data?.results ?? data?.data?.results ?? []);
      } catch {
        if (!cancelled) setBanners([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const toggleActive = async (banner: Banner) => {
    try {
      await api.patch(`/api/v1/products/banners/${banner.id}/`, { is_active: !banner.is_active });
      setBanners((b) => b.map((x) => x.id === banner.id ? { ...x, is_active: !x.is_active } : x));
      showToast(`Banner ${banner.is_active ? 'hidden' : 'activated'}`, 'success');
    } catch {
      showToast('Failed to update banner', 'error');
    }
  };

  const handleDelete = async (id: string | number) => {
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
        <button type="button" onClick={() => showToast('Create banners in Django admin at /manage-store/ → Banners, or POST /api/v1/products/admin/banners/', 'info')} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
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
  );
}
