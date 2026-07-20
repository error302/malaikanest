/**
 * Related products — fetches AI-powered similar products from the Django backend.
 * Falls back to same-category products if the AI similarity endpoint is unavailable.
 */
import type { Product } from '@/components/malaika/product-card';
import { getImageUrl } from '@/lib/media';

function getApiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.malaikanest.com'
  );
}

function normalizeProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: parseFloat(p.price ?? '0') || 0,
    originalPrice: p.compare_price ? parseFloat(p.compare_price) : undefined,
    image: p.image ? getImageUrl(p.image) : undefined,
    category: p.category?.name,
    rating: typeof p.rating === 'number' ? p.rating : undefined,
    reviewCount: p.review_count,
    badge: p.badge,
    inStock: (p.available_stock ?? p.stock ?? 0) > 0,
    hasVariants: Boolean(p.has_variants),
  };
}

/**
 * Get related products for a given product slug.
 * Tries the AI similarity endpoint first, falls back to same-category.
 */
export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const baseUrl = getApiBaseUrl();

  // Try AI similarity endpoint
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${baseUrl}/api/v1/ai/similar-products/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ product_slug: slug, limit }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const results = data?.results ?? data?.data?.results ?? data?.data ?? [];
      if (Array.isArray(results) && results.length > 0) {
        return results.map(normalizeProduct);
      }
    }
  } catch {
    // fall through to category fallback
  }

  // Fallback: get products from the same category
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${baseUrl}/api/v1/products/products/?ordering=-rating&limit=${limit + 4}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const results = data?.results ?? data?.data?.results ?? [];
      // Exclude the current product, take the first `limit`
      const filtered = results
        .filter((p: any) => p.slug !== slug)
        .slice(0, limit)
        .map(normalizeProduct);
      return filtered;
    }
  } catch {
    // return empty
  }

  return [];
}
