import { Navbar } from '@/components/malaika/navbar';
import { Hero } from '@/components/malaika/hero';
import { ShopByAge } from '@/components/malaika/shop-by-age';
import { CategoryQuickLinks } from '@/components/malaika/category-quick-links';
import { ProductSection } from '@/components/malaika/product-section';
import { ValueProps } from '@/components/malaika/value-props';
import { Testimonials } from '@/components/malaika/testimonials';
import { Newsletter } from '@/components/malaika/newsletter';
import { Footer } from '@/components/malaika/footer';
import { MobileBottomNav } from '@/components/malaika/mobile-bottom-nav';
import { StoreShell } from '@/components/malaika/store-shell';
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
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

  const { branding, content } = settings;

  return (
    <StoreShell
      branding={branding}
      navbar={<Navbar />}
      mobileNav={<MobileBottomNav />}
    >
      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[300] focus:rounded-md focus:px-4 focus:py-2 focus:bg-white focus:text-[#2C1810] focus:shadow-warm-md"
      >
        Skip to main content
      </a>

      {/* Abandoned cart recovery banner */}
      <CartRecoveryBanner />

      <main id="main" className="flex-1">
        <Hero banners={banners} content={content} />

        {/* Recently viewed (only shows for returning visitors) */}
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
          background="bg-alt"
        />

        <ValueProps props={valueProps} />

        <ProductSection
          id="best-sellers"
          label={content.best_sellers?.label || 'Most loved'}
          title={content.best_sellers?.title || 'Best Sellers'}
          viewAllHref="/best-sellers"
          viewAllLabel={content.best_sellers?.view_all || 'See More'}
          products={bestSellers}
          columns={4}
          background="cream"
        />

        <ThriftedSection products={thrifted} />

        <Testimonials content={content} testimonials={testimonials} />

        <ProductSection
          id="new-arrivals"
          label={content.new_arrivals?.label || 'Just landed'}
          title={content.new_arrivals?.title || 'New Arrivals'}
          viewAllHref="/categories"
          viewAllLabel={content.new_arrivals?.view_all || 'Shop New'}
          products={newArrivals}
          columns={4}
          background="bg-alt"
        />

        <Newsletter content={content} />
      </main>

      <Footer branding={branding} />
    </StoreShell>
  );
}
