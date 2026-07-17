'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon, Upload, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';
import { getImageUrl, shouldUseUnoptimizedImage } from '@/lib/media';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: string;
  compare_price: string;
  stock: string;
  category_id: string;
  brand: string;
  sku: string;
  gender: string;
  age_group: string;
  age_range: string;
  size_label: string;
  featured: boolean;
  status: string;
  seo_title: string;
  seo_description: string;
  image_url: string;
}

interface ProductDetail extends Omit<ProductForm, 'category_id'> {
  id: number;
  category_id: number | null;
  category: number | null;
  image: string | null;
  image_full_url: string | null;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>({
    name: '', slug: '', description: '', price: '', compare_price: '', stock: '0',
    category_id: '', brand: '', sku: '', gender: 'unisex', age_group: '', age_range: '',
    size_label: '', featured: false, status: 'draft', seo_title: '', seo_description: '',
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/api/v1/products/categories/').then(({ data }) => setCategories(data.results || data))
      .catch(() => showToast('Failed to load categories', 'error'));
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/v1/products/products/${id}/`)
      .then((res) => {
        const d: ProductDetail = res.data;
        setForm({
          name: d.name ?? '',
          slug: d.slug ?? '',
          description: d.description ?? '',
          price: d.price != null ? String(d.price) : '',
          compare_price: d.compare_price != null ? String(d.compare_price) : '',
          stock: d.stock != null ? String(d.stock) : '0',
          category_id: d.category_id ? String(d.category_id) : '',
          brand: d.brand ?? '',
          sku: d.sku ?? '',
          gender: d.gender ?? 'unisex',
          age_group: d.age_group ?? '',
          age_range: d.age_range ?? '',
          size_label: d.size_label ?? '',
          featured: Boolean(d.featured),
          status: d.status ?? 'draft',
          seo_title: d.seo_title ?? '',
          seo_description: d.seo_description ?? '',
          image_url: d.image_url ?? '',
        });
        setExistingImage(d.image_full_url || d.image || null);
      })
      .catch(() => showToast('Failed to load product', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast('Only PNG, JPEG or WebP images are allowed', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast('Image must be 5 MB or smaller', 'error');
      e.target.value = '';
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setForm((f) => ({ ...f, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const payload = () => {
    const slug = form.slug.trim() || slugify(form.name);
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('slug', slug);
    fd.append('description', form.description);
    fd.append('price', String(parseFloat(form.price) || 0));
    fd.append('compare_price', form.compare_price ? String(parseFloat(form.compare_price)) : '');
    fd.append('stock', String(parseInt(form.stock) || 0));
    fd.append('category_id', form.category_id);
    fd.append('brand', form.brand);
    fd.append('sku', form.sku);
    fd.append('gender', form.gender);
    fd.append('age_group', form.age_group);
    fd.append('age_range', form.age_range);
    fd.append('size_label', form.size_label);
    fd.append('featured', form.featured ? 'true' : 'false');
    fd.append('status', form.status);
    fd.append('seo_title', form.seo_title);
    fd.append('seo_description', form.seo_description);
    if (form.image_url) fd.append('image_url', form.image_url);
    if (imageFile) fd.append('image', imageFile);
    return fd;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/v1/products/products/${id}/`, payload());
      showToast('Product updated', 'success');
      router.push('/admin/products');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none';
  const inputStyle = { background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' };

  if (loading) {
    return (
      <div className="max-w-3xl">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>
          <ArrowLeft size={14} /> Back to products
        </Link>
        <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>
        <ArrowLeft size={14} /> Back to products
      </Link>
      <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-6" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        Edit Product
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Basic Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugTouched ? form.slug : slugify(e.target.value) })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Slug *</label>
              <input required value={form.slug} onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: e.target.value }); }} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={inputClass} style={inputStyle} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>SKU</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="">— Select category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon size={18} style={{ color: 'var(--brand-gold)' }} />
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Product Image</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl border flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover" />
              ) : existingImage ? (
                <img src={getImageUrl(existingImage)} alt="Product" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={28} style={{ color: 'var(--brand-text-muted)' }} />
              )}
            </div>
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium cursor-pointer" style={{ background: 'var(--brand-warm)', color: 'var(--brand-gold)' }}>
                <Upload size={14} /> Choose image
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageSelect} />
              </label>
              {(imagePreview || existingImage || form.image_url) && (
                <button type="button" onClick={handleImageRemove} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs" style={{ background: 'rgba(196,112,74,0.1)', color: 'var(--brand-terra)' }}>
                  <X size={12} /> Remove
                </button>
              )}
              <p className="text-[11px]" style={{ color: 'var(--brand-text-muted)' }}>
                PNG, JPEG or WebP. Max 5 MB.
              </p>
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Or image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" className={inputClass} style={inputStyle} />
          </div>
        </div>

        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Pricing & Inventory</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Price (KES) *</label>
              <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Compare price</label>
              <input type="number" step="0.01" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
          </div>
        </div>

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
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Age range</label>
              <input value={form.age_range} onChange={(e) => setForm({ ...form, age_range: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Size label</label>
              <input value={form.size_label} onChange={(e) => setForm({ ...form, size_label: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-4 text-sm" style={{ color: 'var(--brand-brown)' }}>
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            Featured product (show on homepage)
          </label>
        </div>

        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>SEO</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>SEO Title</label>
              <input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} maxLength={70} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>SEO Description</label>
              <textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} maxLength={160} rows={2} className={inputClass} style={inputStyle} />
            </div>
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
