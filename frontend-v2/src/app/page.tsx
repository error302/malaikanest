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
import {
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getActiveBanners,
} from '@/lib/products';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const [featured, bestSellers, newArrivals, banners] = await Promise.all([
    getFeaturedProducts(),
    getBestSellers(),
    getNewArrivals(),
    getActiveBanners(),
  ]);

  return (
    <StoreShell
      announcement={<></>}
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

      <main id="main" className="flex-1">
        <Hero banners={banners} />
        <ShopByAge />
        <CategoryQuickLinks />

        <ProductSection
          id="featured"
          label="Hand-picked"
          title="Featured Products"
          viewAllHref="/categories"
          viewAllLabel="View All"
          products={featured}
          columns={4}
          background="bg-alt"
        />

        <ValueProps />

        <ProductSection
          id="best-sellers"
          label="Most loved"
          title="Best Sellers"
          viewAllHref="/best-sellers"
          viewAllLabel="See More"
          products={bestSellers}
          columns={4}
          background="cream"
        />

        <Testimonials />

        <ProductSection
          id="new-arrivals"
          label="Just landed"
          title="New Arrivals"
          viewAllHref="/categories"
          viewAllLabel="Shop New"
          products={newArrivals}
          columns={4}
          background="bg-alt"
        />

        <Newsletter />
      </main>

      <Footer />
    </StoreShell>
  );
}
