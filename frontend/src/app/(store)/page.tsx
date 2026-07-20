import { Hero } from '@/components/malaika/hero';
import { ShopByAge } from '@/components/malaika/shop-by-age';
import { CategoryQuickLinks } from '@/components/malaika/category-quick-links';
import { ProductSection } from '@/components/malaika/product-section';
import { ValueProps } from '@/components/malaika/value-props';
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

export const revalidate = 60;
export const dynamic = 'auto';

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
        <Hero banners={banners} content={content} />
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
    </>
  );
}
