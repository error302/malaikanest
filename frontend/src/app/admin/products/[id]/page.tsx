'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api, { handleApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { VariantForm } from '@/components/admin/VariantEditor';
import { GalleryChange } from '@/components/admin/ProductGalleryUploader';
import { submitProductUpdate } from '@/lib/product-admin';
import { ProductFormLayout } from '@/components/admin/ProductFormLayout';

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
        const [productRes, catRes] = await Promise.all([
          api.get(`/api/v1/products/admin/products/${params.id}/`),
          api.get('/api/v1/products/categories/', { headers: { 'X-No-Auth-Redirect': 'true' } }),
        ]);
        if (cancelled) return;

        const product = productRes.data?.data ?? productRes.data;
        const getCategoryId = (cat: any) => {
          if (!cat) return '';
          if (typeof cat === 'object') return cat.id || '';
          return String(cat);
        };

        setForm({
          ...product,
          price: String(product.price ?? ''),
          compare_price: product.compare_price ? String(product.compare_price) : '',
          stock: String(product.stock ?? 0),
          category: getCategoryId(product.category),
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
              image_url: v.image_url || v.image || '',
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

    try {
      await submitProductUpdate(params.id, form, variants, variantsTouched, imageFile, galleryChange);
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

  return (
    <ProductFormLayout
      title={`Edit: ${form.name}`}
      form={form}
      setForm={setForm}
      categories={categories}
      imageFile={imageFile}
      imagePreview={imagePreview}
      onFileChange={handleFileChange}
      galleryInitial={galleryInitial}
      onGalleryChange={setGalleryChange}
      variants={variants}
      onVariantsChange={handleVariantsChange}
      saving={saving}
      onSubmit={handleSubmit}
    />
  );
}
