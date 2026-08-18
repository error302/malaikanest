import { Hero } from '@/components/malaika/hero';
import { ShopByAge } from '@/components/malaika/shop-by-age';
import { CategoryQuickLinks } from '@/components/malaika/category-quick-links';
import { ProductSection } from '@/components/malaika/product-section';
import { ValueProps } from '@/components/malaika/value-props';
import { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import { Testimonials } from '@/components/malaika/testimonials';
import { Newsletter } from '@/components/malaika/newsletter';
import { ThriftedSection } from '@/components/malaika/thrifted-section';
import { CartRecoveryBanner } from '@/components/malaika/cart-recovery-banner';
import { RecentlyViewedSection } from '@/components/malaika/recently-viewed-section';
import {
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getActiveBanners,
} from '@/lib/products';
import { getSiteSettings, getValueProps, getTestimonials } from '@/lib/settings';
import { getFeaturedThrifted } from '@/lib/thrifted';

import { Metadata } from 'next';

// Lazy load non-critical sections below the fold
const DynamicValueProps = nextDynamic(() => import('@/components/malaika/value-props').then(mod => mod.ValueProps), {
  ssr: true,
  loading: () => <div className="h-40 w-full animate-pulse bg-gray-100" />
});
const DynamicTestimonials = nextDynamic(() => import('@/components/malaika/testimonials').then(mod => mod.Testimonials), {
  ssr: true,
  loading: () => <div className="h-64 w-full animate-pulse bg-gray-100" />
});
const DynamicNewsletter = nextDynamic(() => import('@/components/malaika/newsletter').then(mod => mod.Newsletter), {
  ssr: true,
  loading: () => <div className="h-64 w-full animate-pulse bg-gray-100" />
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = settings.branding?.store_name || 'Malaika Nest';
  
  return {
    title: 'Baby Shop in Mombasa | Organic Baby Clothing & Gifts',
    description: `Looking for a baby shop in Mombasa? ${storeName} offers premium organic baby clothing, accessories & maternity wear. Free local delivery & M-Pesa accepted. Trusted by 5,000+ Kenyan families.`,
    alternates: { canonical: 'https://malaikanest.com/' },
    openGraph: {
      title: `${storeName} — Mombasa's Premium Baby Shop`,
      description: `Premium organic baby clothing, accessories & maternity wear. Free local delivery in Mombasa & M-Pesa accepted.`,
    },
  };
}

export default async function HomePage() {
  const [featured, bestSellers, newArrivals, banners, settings, valueProps, testimonials, thrifted] = await Promise.all([
    getFeaturedProducts(),
    getBestSellers(),
    getNewArrivals(),
    getActiveBanners(),
    getSiteSettings(),
    getValueProps(),
    getTestimonials(),
    getFeaturedThrifted(4),
  ]);

  const { content } = settings;

  return (
    <>
      <CartRecoveryBanner />
      <main id="main" className="flex-1">
        <Hero banners={banners} />
        <RecentlyViewedSection />
        <ShopByAge content={content} />
        <CategoryQuickLinks content={content} />
        <ProductSection
          id="featured"
          label={content.featured?.label || 'Hand-picked'}
          title={content.featured?.title || 'Featured Products'}
          viewAllHref="/categories"
          viewAllLabel={content.featured?.view_all || 'View All'}
          products={featured}
          columns={4}
          background="white"
        />
        <Suspense fallback={<div className="h-40 w-full animate-pulse bg-gray-100" />}>
          <DynamicValueProps props={valueProps} />
        </Suspense>
        <ProductSection
          id="best-sellers"
          label={content.best_sellers?.label || 'Most loved'}
          title={content.best_sellers?.title || 'Best Sellers'}
          viewAllHref="/best-sellers"
          viewAllLabel={content.best_sellers?.view_all || 'See More'}
          products={bestSellers}
          columns={4}
          background="bg-alt"
        />
        <ThriftedSection products={thrifted} />
        <Suspense fallback={<div className="h-64 w-full animate-pulse bg-gray-100" />}>
          <DynamicTestimonials content={content} testimonials={testimonials} />
        </Suspense>
        <ProductSection
          id="new-arrivals"
          label={content.new_arrivals?.label || 'Just landed'}
          title={content.new_arrivals?.title || 'New Arrivals'}
          viewAllHref="/categories"
          viewAllLabel={content.new_arrivals?.view_all || 'Shop New'}
          products={newArrivals}
          columns={4}
          background="white"
        />
        <Suspense fallback={<div className="h-64 w-full animate-pulse bg-gray-100" />}>
          <DynamicNewsletter content={content} />
        </Suspense>
      </main>
    </>
  );
}
