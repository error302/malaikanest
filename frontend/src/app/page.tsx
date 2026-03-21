/**
 * app/page.tsx — Homepage
 *
 * Fetches featured products, best sellers, and new arrivals from the
 * Django backend and passes them to the relevant display components.
 */

import HeroSection from '@/components/home/HeroSection';
import Banners from '@/components/Banners';
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

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Organic Cotton Onesie Set (3 pcs)',
    slug: 'organic-cotton-onesie-set',
    price: '2100',
    original_price: '2600',
    rating: 5,
    review_count: 24,
    image: '/images/products/onesie-set.jpg',
    badge: 'New In',
    badge_color: 'bg-[#1A3A2A] text-[#E8C98A]',
    category: { name: 'Clothing' },
    stock: 10,
  },
  {
    id: 2,
    name: 'Soft Sensory Teddy Bear',
    slug: 'soft-sensory-teddy-bear',
    price: '1800',
    original_price: '2200',
    rating: 5,
    review_count: 41,
    image: '/images/products/teddy-bear.jpg',
    badge: 'Best Seller',
    badge_color: 'bg-[#C4704A] text-white',
    category: { name: 'Toys' },
    stock: 15,
  },
  {
    id: 3,
    name: 'BPA-Free Feeding Bottle Set',
    slug: 'bpa-free-feeding-bottle-set',
    price: '950',
    original_price: '1200',
    rating: 4,
    review_count: 18,
    image: '/images/products/feeding-set.jpg',
    badge: 'Popular',
    category: { name: 'Baby Essentials' },
    stock: 20,
  },
  {
    id: 4,
    name: 'Waterproof Mattress Protector',
    slug: 'waterproof-mattress-protector',
    price: '3200',
    rating: 5,
    review_count: 9,
    image: '/images/products/mattress-protector.jpg',
    category: { name: 'Nursery' },
    stock: 8,
  },
];

export default async function HomePage() {
  const [featured, bestSellers, newArrivals] = await Promise.all([
    getFeaturedProducts(),
    getBestSellers(),
    getNewArrivals(),
  ]);

  const featuredProducts = featured.length ? featured : FALLBACK_PRODUCTS;
  const bestSellerProducts = bestSellers.length ? bestSellers : FALLBACK_PRODUCTS;
  const newArrivalProducts = newArrivals.length ? newArrivals : FALLBACK_PRODUCTS;

  return (
    <>
      {/* 1. Full-bleed slideshow hero */}
      <HeroSection />

      {/* 2. Banners */}
      <Banners />

      {/* 3. Category quick-links */}
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
