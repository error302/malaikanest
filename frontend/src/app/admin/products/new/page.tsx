'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { handleApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { VariantForm } from '@/components/admin/VariantEditor';
import { GalleryChange } from '@/components/admin/ProductGalleryUploader';
import { appendVariantsToFormData } from '@/lib/product-admin';
import { ProductFormLayout } from '@/components/admin/ProductFormLayout';

interface Category {
  id: string;
  name: string;
  slug: string;
  full_slug?: string;
  parent?: string | null;
  children?: Category[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [galleryChange, setGalleryChange] = useState<GalleryChange | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', compare_price: '', stock: '0',
    category: '', brand: '', sku: '', gender: 'unisex', age_group: '', age_range: '',
    size_label: '', featured: false, is_active: true, status: 'draft',
    image_url: '',
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/api/v1/products/categories/', {
          headers: { 'X-No-Auth-Redirect': 'true' },
        });
        if (cancelled) return;
        const data = res.data;
        const cats = data?.results ?? data?.data?.results ?? data?.data ?? data ?? [];
        setCategories(Array.isArray(cats) ? cats : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const generateSlug = (name: string) => {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
    if (file) setForm((prev) => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('slug', form.slug || generateSlug(form.name));
    fd.append('description', form.description || '');
    fd.append('price', form.price);
    fd.append('stock', String(parseInt(form.stock) || 0));
    fd.append('gender', form.gender);
    fd.append('status', form.status);
    fd.append('featured', form.featured ? 'true' : 'false');
    fd.append('is_active', form.is_active ? 'true' : 'false');
    if (form.category) fd.append('category', form.category);
    if (form.compare_price) fd.append('compare_price', form.compare_price);
    if (form.brand) fd.append('brand', form.brand);
    if (form.sku) fd.append('sku', form.sku);
    if (form.age_group) fd.append('age_group', form.age_group);
    if (form.age_range) fd.append('age_range', form.age_range);
    if (form.size_label) fd.append('size_label', form.size_label);

    if (imageFile) {
      fd.append('image', imageFile);
    } else if (form.image_url) {
      fd.append('image_url', form.image_url);
    }

    if (variants.length > 0) {
      appendVariantsToFormData(fd, variants, { includeId: false });
    }

    try {
      const res = await api.post('/api/v1/products/admin/products/', fd);
      const createdId = res.data?.data?.id ?? res.data?.id;

      if (createdId && galleryChange && galleryChange.galleryFiles.length > 0) {
        const gfd = new FormData();
        galleryChange.galleryFiles.forEach((f) => gfd.append('gallery_images', f));
        await api.patch(`/api/v1/products/admin/products/${createdId}/`, gfd);
      }

      showToast('Product created successfully!', 'success');
      router.push('/admin/products');
    } catch (err: any) {
      const msg = handleApiError(err, 'Failed to create product');
      showToast(msg, 'error');
      if (err?.response?.data) {
        console.error('Product creation error:', err.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProductFormLayout
      title="New Product"
      form={form}
      setForm={setForm}
      categories={categories}
      imageFile={imageFile}
      imagePreview={imagePreview}
      onFileChange={handleFileChange}
      galleryInitial={undefined}
      onGalleryChange={setGalleryChange}
      variants={variants}
      onVariantsChange={setVariants}
      saving={saving}
      onSubmit={handleSubmit}
      onNameChange={handleNameChange}
    />
  );
}
