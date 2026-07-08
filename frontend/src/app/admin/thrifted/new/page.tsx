'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Sparkles, Upload } from 'lucide-react';
import { showToast } from '@/lib/toast';

const CONDITIONS = [
  { value: 'like_new', label: 'Like New — barely used, no flaws' },
  { value: 'good', label: 'Good — minor wear, lots of life left' },
  { value: 'fair', label: 'Fair — visible wear but functional' },
];

const SIZES = ['newborn', '0-3m', '3-6m', '6-9m', '6-12m', '1y', '2y', '3y', '4y', '5y', '6y', '7y', '8y', '9y', '10y', '11y', '12y', 'one-size'];

export default function NewThriftedPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', originalPrice: '',
    condition: 'good', brand: '', size: '2y', gender: 'unisex', ageGroup: 'baby',
    image: '', image2: '', image3: '',
    isFeatured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.image) {
      showToast('Name, price and main image are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/thrifted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create');
      showToast('Thrifted item uploaded!', 'success');
      router.push('/admin/thrifted');
    } catch {
      showToast('Failed to upload item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none';
  const inputStyle = { background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' };

  return (
    <div className="max-w-3xl">
      <Link href="/admin/thrifted" className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>
        <ArrowLeft size={14} /> Back to thrifted items
      </Link>
      <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        <Sparkles size={24} style={{ color: 'var(--brand-terra)' }} /> Upload Thrifted Item
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--brand-text-muted)' }}>
        Add a pre-loved piece to your mtumba collection. Each item is one-of-a-kind.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Images */}
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Upload size={18} style={{ color: 'var(--brand-terra)' }} />
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Images</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Main image URL *</label>
              <input required value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://res.cloudinary.com/…/item.jpg" className={inputClass} style={inputStyle} />
              <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>Paste a Cloudinary/CDN URL. Upload to Cloudinary first, then paste the link.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Image 2 URL (optional)</label>
                <input value={form.image2} onChange={(e) => setForm({ ...form, image2: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Image 3 URL (optional)</label>
                <input value={form.image3} onChange={(e) => setForm({ ...form, image3: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
            </div>
            {form.image && (
              <div className="mt-2 w-32 h-32 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--brand-border)' }}>
                <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Item Details</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Next Baby Romper — Striped (0-3m)" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Describe the condition, any flaws, what's included…" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Original brand</label>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Next, H&M, Mothercare, George" className={inputClass} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Pricing</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Selling price (KES) *</label>
              <input required type="number" step="50" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="450" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Original retail price (KES, optional)</label>
              <input type="number" step="50" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} placeholder="1800" className={inputClass} style={inputStyle} />
              <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>Shows the savings discount badge</p>
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Condition & Fit</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Condition *</label>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={inputClass} style={inputStyle}>
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Size</label>
                <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className={inputClass} style={inputStyle}>
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputClass} style={inputStyle}>
                  <option value="unisex">Unisex</option>
                  <option value="boy">Boy</option>
                  <option value="girl">Girl</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Age group</label>
                <select value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })} className={inputClass} style={inputStyle}>
                  <option value="baby">Baby (0-2)</option>
                  <option value="toddler">Toddler (2-5)</option>
                  <option value="kids">Kids (6-12)</option>
                </select>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 mt-4 text-sm" style={{ color: 'var(--brand-brown)' }}>
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            Feature on homepage thrifted section
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-terra)', color: '#FFFFFF' }}>
            <Save size={16} /> {saving ? 'Uploading…' : 'Upload Item'}
          </button>
          <Link href="/admin/thrifted" className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
