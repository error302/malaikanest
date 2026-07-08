'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { showToast } from '@/lib/toast';

const CONDITIONS = [
  { value: 'like_new', label: 'Like New — barely used, no flaws' },
  { value: 'good', label: 'Good — minor wear, lots of life left' },
  { value: 'fair', label: 'Fair — visible wear but functional' },
];

const SIZES = ['newborn', '0-3m', '3-6m', '6-9m', '6-12m', '1y', '2y', '3y', '4y', '5y', '6y', '7y', '8y', '9y', '10y', '11y', '12y', 'one-size'];

export default function EditThriftedPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/thrifted')
      .then((r) => r.json())
      .then((data) => {
        const found = (data.products || []).find((p: any) => p.id === params.id);
        if (found) {
          setForm({
            ...found,
            price: String(found.price),
            originalPrice: found.originalPrice ? String(found.originalPrice) : '',
          });
        } else {
          showToast('Item not found', 'error');
          router.push('/admin/thrifted');
        }
      })
      .catch(() => router.push('/admin/thrifted'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/thrifted/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      showToast('Thrifted item updated', 'success');
      router.push('/admin/thrifted');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <div className="text-center py-20" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>;
  }

  const inputClass = 'w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none';
  const inputStyle = { background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' };

  return (
    <div className="max-w-3xl">
      <Link href="/admin/thrifted" className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>
        <ArrowLeft size={14} /> Back to thrifted items
      </Link>
      <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        <Sparkles size={24} style={{ color: 'var(--brand-terra)' }} /> Edit Thrifted Item
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--brand-text-muted)' }}>{form.name}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Images</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Main image URL</label>
              <input value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Image 2 URL</label>
                <input value={form.image2 || ''} onChange={(e) => setForm({ ...form, image2: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Image 3 URL</label>
                <input value={form.image3 || ''} onChange={(e) => setForm({ ...form, image3: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Details</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Name</label>
              <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Description</label>
              <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Brand</label>
              <input value={form.brand || ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Pricing & Attributes</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Price (KES)</label>
              <input type="number" step="50" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Original price (KES)</label>
              <input type="number" step="50" value={form.originalPrice || ''} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Condition</label>
              <select value={form.condition || 'good'} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={inputClass} style={inputStyle}>
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Size</label>
              <select value={form.size || '2y'} onChange={(e) => setForm({ ...form, size: e.target.value })} className={inputClass} style={inputStyle}>
                {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Gender</label>
              <select value={form.gender || 'unisex'} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputClass} style={inputStyle}>
                <option value="unisex">Unisex</option>
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Age group</label>
              <select value={form.ageGroup || 'baby'} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })} className={inputClass} style={inputStyle}>
                <option value="baby">Baby (0-2)</option>
                <option value="toddler">Toddler (2-5)</option>
                <option value="kids">Kids (6-12)</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-brown)' }}>
              <input type="checkbox" checked={form.isAvailable ?? true} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
              Available (not sold)
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-brown)' }}>
              <input type="checkbox" checked={form.isFeatured ?? false} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              Featured on homepage
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-brown)' }}>
              <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active (visible in store)
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-terra)', color: '#FFFFFF' }}>
            <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href="/admin/thrifted" className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
