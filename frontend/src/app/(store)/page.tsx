/**
 * app/page.tsx — Homepage
 *
 * Fetches featured products, best sellers, and new arrivals from the
 * Django backend and passes them to the relevant display components.
 */

import HeroSection from '@/components/home/HeroSection';
import {
  CategoryQuickLinks,
  ProductSection,
  ValuePropsSection,
  TestimonialsSection,
  NewsletterSection,
} from '@/components/home/ProductShowcase';
import { getImageUrl } from '@/lib/media';

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
  badge?: string;
  badge_color?: string;
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/products/?featured=true&limit=4`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results ?? data.data?.results ?? [];
    if (!results.length) {
      const fallback = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/products/?ordering=-created_at&limit=4`,
        { next: { revalidate: 60 } }
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
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/products/?ordering=-created_at&limit=4`,
      { next: { revalidate: 60 } }
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
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/products/?ordering=-created_at&limit=4`,
      { next: { revalidate: 60 } }
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
      {/* 1. Full-bleed slideshow hero (includes banners) */}
      <HeroSection />

      {/* 2. Category quick-links */}
      <CategoryQuickLinks />

      {/* 3. Featured — large + side list */}
      <ProductSection
        label="Hand-picked"
        title="Featured Products"
        viewAllHref="/categories"
        products={featuredProducts}
        layout="featured+3"
      />

      {/* 4. Value props */}
      <ValuePropsSection />

      {/* 5. Best sellers — 4 column grid */}
      <ProductSection
        label="Most loved"
        title="Best Sellers"
        viewAllHref="/best-sellers"
        products={bestSellerProducts}
        layout="grid4"
      />

      {/* 6. Testimonials */}
      <TestimonialsSection />

      {/* 7. New arrivals — 4 column grid */}
      <ProductSection
        label="Just landed"
        title="New Arrivals"
        viewAllHref="/categories"
        products={newArrivalProducts}
        layout="grid4"
      />

      {/* 8. Newsletter */}
      <NewsletterSection />
    </>
  );
}
