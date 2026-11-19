'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import VariantEditor, { VariantForm } from '@/components/admin/VariantEditor';
import { GalleryChange } from '@/components/admin/ProductGalleryUploader';
import { ProductImageSection } from '@/components/admin/ProductImageSection';

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  category: string;
  sku: string;
  price: string;
  compare_price: string;
  stock: string;
  gender: string;
  age_group: string;
  status: string;
  featured: boolean;
  is_active: boolean;
  image_url: string;
  [key: string]: any;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFormLayoutProps {
  title: string;
  form: ProductFormData;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  categories: CategoryOption[];
  imageFile: File | null;
  imagePreview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  galleryInitial?: any[];
  onGalleryChange: (change: GalleryChange) => void;
  variants: VariantForm[];
  onVariantsChange: (variants: VariantForm[]) => void;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onNameChange?: (name: string) => void;
}

const inputClass = 'w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none';
const inputStyle = { background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' };

export function ProductFormLayout({
  title,
  form,
  setForm,
  categories,
  imageFile,
  imagePreview,
  onFileChange,
  galleryInitial,
  onGalleryChange,
  variants,
  onVariantsChange,
  saving,
  onSubmit,
  onNameChange,
}: ProductFormLayoutProps) {
  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>
        <ArrowLeft size={14} /> Back to products
      </Link>
      <h1 className="font-serif text-2xl sm:text-3xl font-semibold mb-6" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        {title}
      </h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Basic Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Name *</label>
              <input
                required
                value={form.name || ''}
                onChange={(e) => (onNameChange ? onNameChange(e.target.value) : setForm({ ...form, name: e.target.value }))}
                placeholder="e.g. Organic Cotton Onesie (3-Pack)"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Slug (URL)</label>
              <input
                value={form.slug || ''}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto-generated-from-name"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Description</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className={inputClass}
                style={inputStyle}
              />
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
        <ProductImageSection
          imageFile={imageFile}
          imagePreview={imagePreview}
          imageUrl={form.image_url || ''}
          onFileChange={onFileChange}
          onUrlChange={(url) => setForm({ ...form, image_url: url })}
          initialGallery={galleryInitial || []}
          onGalleryChange={onGalleryChange}
          inputClass={inputClass}
          inputStyle={inputStyle}
        />

        {/* Variants */}
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Variants (color / size)</h2>
          <VariantEditor variants={variants} onChange={onVariantsChange} />
        </div>

        {/* Pricing & Attributes */}
        <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Pricing & Attributes</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Price (KES) *</label>
              <input required type="number" step="0.01" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Compare price</label>
              <input type="number" step="0.01" value={form.compare_price || ''} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Stock</label>
              <input type="number" value={form.stock ?? '0'} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} style={inputStyle} />
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
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href="/admin/products" className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
