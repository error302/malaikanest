/**
 * Related products — fetches similar products from the same category.
 */
import type { Product } from '@/components/malaika/product-card';
import { getImageUrl } from '@/lib/media';
import { getApiBaseUrl } from '@/lib/site-config';

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
    variantCount: typeof p.variant_count === 'number' ? p.variant_count : 0,
  };
}

/**
 * Get related products for a given product slug.
 * Returns products from the same category or best sellers.
 */
export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const baseUrl = getApiBaseUrl();

  // Get products from the same category or generally popular products
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
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
