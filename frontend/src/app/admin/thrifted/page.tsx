'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface ThriftedItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  condition: string;
  brand: string;
  size: string;
  image: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

const CONDITION_LABELS: Record<string, string> = {
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
};

export default function AdminThriftedPage() {
  const [items, setItems] = useState<ThriftedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAll = () => {
    setLoading(true);
    fetch('/api/admin/thrifted')
      .then((r) => r.json())
      .then((data) => setItems(data.products || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/thrifted');
        if (cancelled) return;
        const data = await res.json();
        setItems(data.products || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this thrifted item permanently?')) return;
    try {
      await fetch(`/api/admin/thrifted/${id}`, { method: 'DELETE' });
      setItems((arr) => arr.filter((x) => x.id !== id));
      showToast('Thrifted item deleted', 'success');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const toggleAvailable = async (item: ThriftedItem) => {
    try {
      await fetch(`/api/admin/thrifted/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      setItems((arr) => arr.map((x) => (x.id === item.id ? { ...x, isAvailable: !x.isAvailable } : x)));
      showToast(`Marked as ${!item.isAvailable ? 'available' : 'sold'}`, 'success');
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const toggleFeatured = async (item: ThriftedItem) => {
    try {
      await fetch(`/api/admin/thrifted/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !item.isFeatured }),
      });
      setItems((arr) => arr.map((x) => (x.id === item.id ? { ...x, isFeatured: !x.isFeatured } : x)));
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const filtered = items.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold flex items-center gap-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            <Sparkles size={24} style={{ color: 'var(--brand-terra)' }} /> Mtumba / Thrifted
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            {items.length} thrifted item{items.length === 1 ? '' : 's'} · {items.filter((i) => i.isAvailable).length} available
          </p>
        </div>
        <Link href="/admin/thrifted/new" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--brand-terra)', color: '#FFFFFF' }}>
          <Plus size={16} /> Upload Thrifted Item
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or brand…" className="input-warm w-full" style={{ background: '#FFFFFF' }} />
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Sparkles size={32} className="mx-auto mb-3" style={{ color: 'var(--brand-text-muted)' }} />
            <p className="text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>No thrifted items yet. Upload your first mtumba piece.</p>
            <Link href="/admin/thrifted/new" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: 'var(--brand-terra)', color: '#FFFFFF' }}>
              <Plus size={16} /> Upload First Item
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--brand-bg-alt)' }}>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Item</th>
                  <th className="text-left p-4 font-semibold hidden sm:table-cell" style={{ color: 'var(--brand-text)' }}>Brand</th>
                  <th className="text-left p-4 font-semibold hidden md:table-cell" style={{ color: 'var(--brand-text)' }}>Condition</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Price</th>
                  <th className="text-left p-4 font-semibold hidden lg:table-cell" style={{ color: 'var(--brand-text)' }}>Status</th>
                  <th className="text-right p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid var(--brand-border)' }}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--brand-warm)' }}>
                          {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate" style={{ color: 'var(--brand-text)' }}>{item.name}</div>
                          <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>Size {item.size}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell" style={{ color: 'var(--brand-text-secondary)' }}>{item.brand || '—'}</td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--brand-warm)', color: 'var(--brand-brown)' }}>
                        {CONDITION_LABELS[item.condition] || item.condition}
                      </span>
                    </td>
                    <td className="p-4 font-semibold" style={{ color: 'var(--brand-terra)' }}>
                      KES {Number(item.price).toLocaleString('en-KE')}
                      {item.originalPrice && (
                        <div className="text-[10px] line-through font-normal" style={{ color: 'var(--brand-text-muted)' }}>
                          KES {Number(item.originalPrice).toLocaleString('en-KE')}
                        </div>
                      )}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex flex-col gap-1">
                        <button type="button" onClick={() => toggleAvailable(item)} className="text-[10px] px-2 py-0.5 rounded-full w-fit" style={{ background: item.isAvailable ? 'rgba(45,90,66,0.12)' : 'rgba(196,112,74,0.12)', color: item.isAvailable ? 'var(--brand-green-light)' : 'var(--brand-terra)' }}>
                          {item.isAvailable ? '● Available' : '○ Sold'}
                        </button>
                        <button type="button" onClick={() => toggleFeatured(item)} className="text-[10px] px-2 py-0.5 rounded-full w-fit" style={{ background: item.isFeatured ? 'rgba(139,105,20,0.12)' : 'transparent', color: item.isFeatured ? 'var(--brand-gold)' : 'var(--brand-text-muted)' }}>
                          {item.isFeatured ? '★ Featured' : '☆ Not featured'}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/thrifted/${item.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--brand-warm)]" aria-label="Edit">
                          <Pencil size={14} style={{ color: 'var(--brand-brown)' }} />
                        </Link>
                        <button type="button" onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--brand-warm)]" aria-label="Delete">
                          <Trash2 size={14} style={{ color: 'var(--brand-terra)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
