import api from '@/lib/api';

export interface AdminVariantItem {
  id?: number | string;
  color?: string;
  size?: string | null;
  sku?: string | null;
  price_modifier?: string | number;
  stock?: string | number;
  image_url?: string | null;
  image_file?: File | null;
}

export interface AdminProductFormValues {
  name: string;
  slug?: string;
  description?: string;
  price: string;
  stock: string;
  gender?: string;
  status?: string;
  featured?: boolean;
  is_active?: boolean;
  category?: string | null;
  compare_price?: string;
  brand?: string;
  sku?: string;
  age_group?: string;
  age_range?: string;
  size_label?: string;
  image_url?: string;
}

export function appendVariantsToFormData(
  fd: FormData,
  variants: AdminVariantItem[],
  options?: { includeId?: boolean }
): void {
  const clean = variants
    .filter((v) => v.color)
    .map((v) => ({
      ...(v.id && options?.includeId !== false ? { id: v.id } : {}),
      color: v.color,
      size: v.size || null,
      sku: v.sku || null,
      price_modifier: v.price_modifier || '0',
      stock: typeof v.stock === 'number' ? v.stock : parseInt(String(v.stock || '0'), 10) || 0,
      image_url: v.image_url || null,
      image_file: v.image_file,
    }));

  if (clean.length === 0) return;

  const hasVariantFiles = clean.some((v) => v.image_file);
  if (hasVariantFiles) {
    clean.forEach((v: any, idx: number) => {
      if (v.id) fd.append(`variants[${idx}][id]`, String(v.id));
      fd.append(`variants[${idx}][color]`, v.color || '');
      fd.append(`variants[${idx}][size]`, v.size || '');
      fd.append(`variants[${idx}][sku]`, v.sku || '');
      fd.append(`variants[${idx}][price_modifier]`, String(v.price_modifier || '0'));
      fd.append(`variants[${idx}][stock]`, String(v.stock || 0));
      if (v.image_url) fd.append(`variants[${idx}][image_url]`, v.image_url);
      if (v.image_file) fd.append(`variants[${idx}][image]`, v.image_file);
    });
  } else {
    fd.append('variants', JSON.stringify(clean));
  }
}

function buildProductPayload(form: AdminProductFormValues): Record<string, any> {
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

  return payload;
}

export async function submitProductUpdate(
  productId: string | number,
  form: AdminProductFormValues,
  variants: AdminVariantItem[],
  variantsTouched: boolean,
  imageFile: File | null,
  galleryChange: any
): Promise<void> {
  const payload = buildProductPayload(form);
  if (!imageFile && form.image_url) payload.image_url = form.image_url;

  if (variantsTouched) {
    payload.variants = variants
      .filter((v) => v.color)
      .map((v) => ({
        id: v.id,
        color: v.color,
        size: v.size || null,
        sku: v.sku || null,
        price_modifier: v.price_modifier || '0',
        stock: parseInt(String(v.stock)) || 0,
        image_url: v.image_url || null,
        image_file: v.image_file,
      }));
  }

  const hasGallery =
    galleryChange &&
    (galleryChange.galleryFiles.length > 0 ||
      galleryChange.deleteIds.length > 0 ||
      galleryChange.primaryId !== null ||
      galleryChange.order.length > 0);

  const hasVariantFiles = variantsTouched && payload.variants.some((v: any) => v.image_file);

  if (imageFile || hasGallery || hasVariantFiles) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (k !== 'variants' && v !== null && v !== undefined) fd.append(k, String(v));
    });
    if (imageFile) fd.append('image', imageFile);
    if (galleryChange) {
      galleryChange.galleryFiles.forEach((f: File) => fd.append('gallery_images', f));
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
    if (variantsTouched) {
      appendVariantsToFormData(fd, payload.variants, { includeId: true });
    }
    await api.put(`/api/v1/products/admin/products/${productId}/`, fd);
  } else {
    if (variantsTouched) {
      payload.variants = payload.variants.map(({ image_file, ...rest }: any) => rest);
    }
    await api.put(`/api/v1/products/admin/products/${productId}/`, payload);
  }
}
