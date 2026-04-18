/**
 * app/page.tsx — Homepage
 *
 * Fetches featured products, best sellers, and new arrivals from the
 * Django backend and passes them to the relevant display components.
 */

import HeroSection from '@/components/home/HeroSection';
import {
  ShopByAgeSection,
  CategoryQuickLinks,
  ProductSection,
  ValuePropsSection,
  TestimonialsSection,
  NewsletterSection,
} from '@/components/home/ProductShowcase';
import { getImageUrl } from '@/lib/media';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  original_price?: string;
  image: string | null;
  category?: { name?: string; full_slug?: string };
  rating?: number;
  review_count?: number;
  featured?: boolean;
  stock?: number;
  available_stock?: number;
  has_variants?: boolean;
  badge?: string;
  badge_color?: string;
}

function getApiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://malaikanest.duckdns.org'
  );
}

async function getFeaturedProducts(): Promise<Product[]> {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const res = await fetch(
      `${apiBaseUrl}/api/v1/products/products/?featured=true&limit=8`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results ?? data.data?.results ?? [];
    if (!results.length) {
      const fallback = await fetch(
        `${apiBaseUrl}/api/v1/products/products/?ordering=-created_at&limit=8`,
        { cache: 'no-store' }
      );
      if (fallback.ok) {
        const fd = await fallback.json();
        const fp = fd.results ?? fd.data?.results ?? [];
        return fp.map((p: Record<string, unknown>) => ({
          ...p,
          image: p.image ? getImageUrl(p.image as string) : null,
        }));
      }
      return [];
    }
    return results.map((p: Record<string, unknown>) => ({
      ...p,
      image: p.image ? getImageUrl(p.image as string) : null,
    }));
  } catch {
    return [];
  }
}

async function getBestSellers(): Promise<Product[]> {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const res = await fetch(
      `${apiBaseUrl}/api/v1/products/products/?ordering=-created_at&limit=8`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results ?? data.data?.results ?? [];
    return results.map((p: Record<string, unknown>) => ({
      ...p,
      image: p.image ? getImageUrl(p.image as string) : null,
    }));
  } catch {
    return [];
  }
}

async function getNewArrivals(): Promise<Product[]> {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const res = await fetch(
      `${apiBaseUrl}/api/v1/products/products/?ordering=-created_at&limit=8`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results ?? data.data?.results ?? [];
    return results.map((p: Record<string, unknown>) => ({
      ...p,
      image: p.image ? getImageUrl(p.image as string) : null,
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, bestSellers, newArrivals] = await Promise.all([
    getFeaturedProducts(),
    getBestSellers(),
    getNewArrivals(),
  ]);

  const featuredProducts = featured;
  const bestSellerProducts = bestSellers;
  const newArrivalProducts = newArrivals;

  return (
    <>
      {/* 1. Hero Section with new warm aesthetic */}
      <HeroSection />

      {/* 2. Shop by Age - new horizontal scroll section */}
      <ShopByAgeSection />

      {/* 3. Category quick-links */}
      <CategoryQuickLinks />

      {/* 4. Featured — large + side list */}
      <ProductSection
        label="Hand-picked"
        title="Featured Products"
        viewAllHref="/categories"
        products={featuredProducts}
        layout="featured+3"
      />

      {/* 5. Value props */}
      <ValuePropsSection />

      {/* 6. Best sellers — 4 column grid */}
      <ProductSection
        label="Most loved"
        title="Best Sellers"
        viewAllHref="/best-sellers"
        products={bestSellerProducts}
        layout="grid4"
      />

      {/* 7. Testimonials */}
      <TestimonialsSection />

      {/* 8. New arrivals — 4 column grid */}
      <ProductSection
        label="Just landed"
        title="New Arrivals"
        viewAllHref="/categories"
        products={newArrivalProducts}
        layout="grid4"
      />

      {/* 9. Newsletter */}
      <NewsletterSection />
    </>
  );
}
