/**
 * Server-side data fetchers for the Malaika Nest storefront.
 * These call the Django backend at /api/v1/products/* with graceful fallbacks
 * to sample data when the API is unreachable (e.g. sandbox/dev preview).
 *
 * All product-fetching functions use an in-memory cache with a 60-second TTL
 * to avoid hammering the backend API through the Cloudflare tunnel on every
 * page request.
 */
import { getImageUrl } from '@/lib/media';
import type { Product } from '@/components/malaika/product-card';
import {
  FEATURED_PRODUCTS,
  BEST_SELLERS,
  NEW_ARRIVALS,
} from '@/components/malaika/sample-data';

const PRODUCT_CACHE_TTL = 60_000;
const _productCache = new Map<string, { data: unknown; ts: number }>();

function _cacheGet<T>(key: string, ttl: number): T | null {
  const entry = _productCache.get(key);
  if (entry && Date.now() - entry.ts < ttl) return entry.data as T;
  return null;
}

function _cacheSet<T>(key: string, data: T): void {
  _productCache.set(key, { data, ts: Date.now() });
  if (_productCache.size > 50) {
    const firstKey = _productCache.keys().next().value;
    if (firstKey !== undefined) _productCache.delete(firstKey);
  }
}

export function clearProductCache(): void {
  _productCache.clear();
}

export interface Banner {
  id: number;
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
  image: string;
  mobile_image?: string;
  image_url?: string;
  mobile_image_url?: string;
  is_active: boolean;
  position?: number;
}

export interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  compare_price?: string | null;
  discount_price?: string | null;
  image?: string | null;
  category?: { name?: string; full_slug?: string };
  rating?: number;
  review_count?: number;
  featured?: boolean;
  stock?: number;
  available_stock?: number;
  has_variants?: boolean;
  variant_count?: number;
  badge?: string;
  badge_color?: string;
}

function getApiBaseUrl(): string {
  if (process.env.INTERNAL_API_URL) return process.env.INTERNAL_API_URL;
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (url.includes('localhost') || url.includes('127.0.0.1')) return url;
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:8000';
  }
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'development'
  ) {
    return 'http://localhost:8000';
  }
  return 'https://api.malaikanest.com';
}

function normalizeProduct(p: ApiProduct): Product {
  const price = parseFloat(p.price ?? '0') || 0;
  const originalPrice = p.compare_price
    ? parseFloat(p.compare_price)
    : p.discount_price
    ? parseFloat(p.discount_price)
    : undefined;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price,
    originalPrice: originalPrice && !isNaN(originalPrice) ? originalPrice : undefined,
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

async function fetchProducts(
  params: Record<string, string | number | boolean>
): Promise<{ products: Product[]; ok: boolean }> {
  const cacheKey = `products:${JSON.stringify(params)}`;
  const cached = _cacheGet<{ products: Product[]; ok: boolean }>(cacheKey, PRODUCT_CACHE_TTL);
  if (cached) return cached;

  const baseUrl = getApiBaseUrl();
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) qs.set(String(k), String(v));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${baseUrl}/api/v1/products/products/?${qs.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);
    if (!res.ok) return { products: [], ok: false };
    const data = await res.json();
    const results: ApiProduct[] =
      data?.results ?? data?.data?.results ?? data?.data ?? [];
    if (!Array.isArray(results) || results.length === 0) {
      return { products: [], ok: false };
    }
    const result = { products: results.map(normalizeProduct), ok: true };
    _cacheSet(cacheKey, result);
    return result;
  } catch {
    return { products: [], ok: false };
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { products, ok } = await fetchProducts({ featured: true, limit: 8 });
  if (ok && products.length > 0) return products;
  const { products: recent } = await fetchProducts({ ordering: '-created_at', limit: 8 });
  return recent.length > 0 ? recent : FEATURED_PRODUCTS;
}

export async function getBestSellers(): Promise<Product[]> {
  const { products, ok } = await fetchProducts({ ordering: '-created_at', limit: 8 });
  if (ok && products.length > 0) return products;
  return BEST_SELLERS;
}

export async function getNewArrivals(): Promise<Product[]> {
  const { products, ok } = await fetchProducts({ ordering: '-created_at', limit: 8 });
  if (ok && products.length > 0) return products;
  return NEW_ARRIVALS;
}

export async function getActiveBanners(): Promise<Banner[]> {
  const cacheKey = 'banners:active';
  const cached = _cacheGet<Banner[]>(cacheKey, PRODUCT_CACHE_TTL);
  if (cached) return cached;

  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${baseUrl}/api/v1/products/banners/?is_active=true&ordering=position`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    const results: Banner[] = data?.results ?? data?.data?.results ?? data?.data ?? [];
    if (!Array.isArray(results)) return [];
    const filtered = results.filter(
      (b) => Boolean(b.image || b.image_url || b.mobile_image || b.mobile_image_url)
    );
    _cacheSet(cacheKey, filtered);
    return filtered;
  } catch {
    return [];
  }
}

export type { Product };
