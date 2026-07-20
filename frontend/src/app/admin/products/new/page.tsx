'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  full_slug?: string;
  parent?: number | null;
  children?: Category[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', compare_price: '', stock: '0',
    category: '', brand: '', sku: '', gender: 'unisex', age_group: '', age_range: '',
    size_label: '', featured: false, is_active: true, status: 'draft',
    image_url: '',
  });

  // Fetch categories for the dropdown
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/api/v1/products/categories/', {
          headers: { 'X-No-Auth-Redirect': 'true' },
        });
        if (cancelled) return;
        const data = res.data;
        const cats = data?.results ?? data?.data?.results ?? data ?? [];
        setCategories(Array.isArray(cats) ? cats : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value),  // only auto-fill if slug is empty
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Build the payload matching AdminProductSerializer fields exactly
    const payload: Record<string, any> = {
      name: form.name,
      slug: form.slug || generateSlug(form.name),
      description: form.description || '',
      price: form.price,  // send as string — Django Decimal field accepts string
      stock: parseInt(form.stock) || 0,
      gender: form.gender,
      status: form.status,
      featured: form.featured,
      is_active: form.is_active,
      category: form.category ? parseInt(form.category) : null,
    };

    // Only include optional fields if they have values
    if (form.compare_price) payload.compare_price = form.compare_price;
    if (form.brand) payload.brand = parseInt(form.brand);
    if (form.sku) payload.sku = form.sku;
    if (form.age_group) payload.age_group = form.age_group;
    if (form.age_range) payload.age_range = form.age_range;
    if (form.size_label) payload.size_label = form.size_label;
    if (form.image_url) payload.image_url = form.image_url;

    try {
      await api.post('/api/v1/products/admin/products/', payload);
      showToast('Product created successfully!', 'success');
      router.push('/admin/products');
    } catch (err: any) {
      // Surface Django's field-level validation errors
      const msg = handleApiError(err, 'Failed to create product');
      showToast(msg, 'error');
      // Log full error for debugging
      if (err?.response?.data) {
        console.error('Product creation error:', err.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none';
  const inputStyle = { background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' };

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>
        <ArrowLeft size={14} /> Back to products
      </Link>
      <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-6" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        New Product
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Basic Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Name *</label>
              <input required value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Organic Cotton Onesie (3-Pack)" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Slug (URL) *</label>
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated from name" className={inputClass} style={inputStyle} />
              <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>This is the URL: /products/<strong>{form.slug || 'your-slug'}</strong></p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={inputClass} style={inputStyle} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Category *</label>
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} style={inputStyle}>
                  <option value="">Select a category…</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--brand-terra)' }}>
                    No categories loaded. Check your Django backend connection.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>SKU (optional)</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. MN-ONS-001" className={inputClass} style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon size={18} style={{ color: 'var(--brand-gold)' }} />
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Product Image</h2>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Image URL (Cloudinary/CDN)</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://res.cloudinary.com/…/product.jpg" className={inputClass} style={inputStyle} />
            <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>Paste a Cloudinary URL. The backend will download and store it.</p>
          </div>
          {form.image_url && (
            <div className="mt-3 w-32 h-32 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--brand-border)' }}>
              <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Pricing & Inventory</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Price (KES) *</label>
              <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="1800" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Compare price (KES)</label>
              <input type="number" step="0.01" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} placeholder="2400" className={inputClass} style={inputStyle} />
              <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>Original price (shows discount)</p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Attributes</h2>
          <div className="grid sm:grid-cols-3 gap-3">
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
              <select value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })} className={inputClass} style={inputStyle}>
                <option value="">—</option>
                <option value="baby">Baby (0-2)</option>
                <option value="toddler">Toddler (2-5)</option>
                <option value="kids">Kids (6-12)</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass} style={inputStyle}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (visible)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-brown)' }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Featured (show on homepage)
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-brown)' }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            <Save size={16} /> {saving ? 'Saving…' : 'Save Product'}
          </button>
          <Link href="/admin/products" className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
