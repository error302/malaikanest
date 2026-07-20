'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Image as ImageIcon, Upload } from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import VariantEditor, { VariantForm } from '@/components/admin/VariantEditor';
import ProductGalleryUploader, { GalleryChange } from '@/components/admin/ProductGalleryUploader';

interface Category {
  id: string;
  name: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [variantsTouched, setVariantsTouched] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [galleryInitial, setGalleryInitial] = useState<{ id?: string; url: string; is_primary?: boolean }[]>([]);
  const [galleryChange, setGalleryChange] = useState<GalleryChange | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Fetch product from admin endpoint + categories in parallel
        const [productRes, catRes] = await Promise.all([
          api.get(`/api/v1/products/admin/products/${params.id}/`),
          api.get('/api/v1/products/categories/', { headers: { 'X-No-Auth-Redirect': 'true' } }),
        ]);
        if (cancelled) return;

        const product = productRes.data?.data ?? productRes.data;
        setForm({
          ...product,
          price: String(product.price ?? ''),
          compare_price: product.compare_price ? String(product.compare_price) : '',
          stock: String(product.stock ?? 0),
          category: product.category ? String(product.category) : '',
          brand: product.brand ? String(product.brand) : '',
          image_url: product.image_full_url || product.image_url || '',
        });

        if (Array.isArray(product.variants)) {
          setVariants(
            product.variants.map((v: any) => ({
              id: v.id,
              color: v.color || '',
              size: v.size || '',
              sku: v.sku || '',
              price_modifier: v.price_modifier ? String(v.price_modifier) : '0',
              stock: String(v.stock ?? 0),
            }))
          );
        }

        const existingImages = Array.isArray(product.images) ? product.images : [];
        setGalleryInitial(
          existingImages.map((im: any) => ({
            id: im.id,
            url: im.url,
            is_primary: im.is_primary,
          }))
        );

        const cats = catRes.data?.results ?? catRes.data?.data?.results ?? catRes.data?.data ?? catRes.data ?? [];
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err: any) {
        if (!cancelled) {
          const msg = handleApiError(err, 'Failed to load product');
          showToast(msg, 'error');
          router.push('/admin/products');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [params.id, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleVariantsChange = (next: VariantForm[]) => {
    setVariants(next);
    setVariantsTouched(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Category/brand ids are UUIDs — send them as strings (never parseInt).
    const payload: Record<string, any> = {
      name: form.name,
      slug: form.slug,
      description: form.description || '',
      price: form.price,
      stock: parseInt(form.stock) || 0,
      gender: form.gender || 'unisex',
      status: form.status || 'draft',
      featured: Boolean(form.featured),
      is_active: Boolean(form.is_active),
      category: form.category ? form.category : null,
    };

    if (form.compare_price) payload.compare_price = form.compare_price;
    if (form.brand) payload.brand = form.brand;
    if (form.sku) payload.sku = form.sku;
    if (form.age_group) payload.age_group = form.age_group;
    if (form.age_range) payload.age_range = form.age_range;
    if (form.size_label) payload.size_label = form.size_label;
    if (!imageFile && form.image_url) payload.image_url = form.image_url;

    if (variantsTouched) {
      const clean = variants
        .filter((v) => v.color)
        .map((v) => ({
          id: v.id,
          color: v.color,
          size: v.size || null,
          sku: v.sku || null,
          price_modifier: v.price_modifier || '0',
          stock: parseInt(v.stock) || 0,
        }));
      payload.variants = clean;
    }

    try {
      const hasGallery =
        galleryChange &&
        (galleryChange.galleryFiles.length > 0 ||
          galleryChange.deleteIds.length > 0 ||
          galleryChange.primaryId !== null ||
          galleryChange.order.length > 0);

      if (imageFile || hasGallery) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) fd.append(k, String(v));
        });
        if (imageFile) fd.append('image', imageFile);
        if (galleryChange) {
          galleryChange.galleryFiles.forEach((f) => fd.append('gallery_images', f));
          if (galleryChange.deleteIds.length > 0) {
            fd.append('delete_image_ids', JSON.stringify(galleryChange.deleteIds));
          }
          if (galleryChange.primaryId !== null) {
            fd.append('primary_image_id', galleryChange.primaryId);
          }
          if (galleryChange.order.length > 0) {
            fd.append('image_orders', JSON.stringify(galleryChange.order));
          }
        }
        if (variantsTouched) fd.append('variants', JSON.stringify(payload.variants));
        await api.put(`/api/v1/products/admin/products/${params.id}/`, fd);
      } else {
        await api.put(`/api/v1/products/admin/products/${params.id}/`, payload);
      }
      showToast('Product updated successfully!', 'success');
      router.push('/admin/products');
    } catch (err: any) {
      const msg = handleApiError(err, 'Failed to update product');
      showToast(msg, 'error');
      console.error('Product update error:', err?.response?.data);
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
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>
        <ArrowLeft size={14} /> Back to products
      </Link>
      <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-6" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        Edit: {form.name}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Basic Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Name</label>
              <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Slug (URL)</label>
              <input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Description</label>
              <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className={inputClass} style={inputStyle} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Category</label>
                <select value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} style={inputStyle}>
                  <option value="">Select a category…</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>SKU</label>
                <input value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputClass} style={inputStyle} />
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

          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Upload from your computer</label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-brown)' }}>
              <Upload size={15} /> Choose image
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            {imageFile && <span className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>{imageFile.name}</span>}
          </div>

          {(imagePreview || form.image_url) && (
            <div className="mt-3 w-32 h-32 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--brand-border)' }}>
              <img src={imagePreview || form.image_url} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="my-4 border-t" style={{ borderColor: 'var(--brand-border)' }} />

          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>…or paste an image URL (Cloudinary/CDN)</label>
          <input value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://res.cloudinary.com/…" className={inputClass} style={inputStyle} disabled={!!imageFile} />

          <div className="my-4 border-t" style={{ borderColor: 'var(--brand-border)' }} />

          <ProductGalleryUploader initialImages={galleryInitial} onChange={setGalleryChange} />
        </div>

        {/* Variants */}
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Variants (color / size)</h2>
          <VariantEditor variants={variants} onChange={handleVariantsChange} />
        </div>

        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Pricing & Attributes</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Price (KES)</label>
              <input type="number" step="0.01" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Compare price</label>
              <input type="number" step="0.01" value={form.compare_price || ''} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Stock</label>
              <input type="number" value={form.stock || '0'} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} style={inputStyle} />
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
              <select value={form.age_group || ''} onChange={(e) => setForm({ ...form, age_group: e.target.value })} className={inputClass} style={inputStyle}>
                <option value="">—</option>
                <option value="baby">Baby (0-2)</option>
                <option value="toddler">Toddler (2-5)</option>
                <option value="kids">Kids (6-12)</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Status</label>
              <select value={form.status || 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass} style={inputStyle}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-brown)' }}>
              <input type="checkbox" checked={form.featured ?? false} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-brown)' }}>
              <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href="/admin/products" className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
