'use client';

import { useEffect, useState } from 'react';
import { ProductCard, type Product } from '@/components/malaika/product-card';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/media';

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
    badge: p.badge || 'Top Rated',
    inStock: (p.available_stock ?? p.stock ?? 0) > 0,
    hasVariants: Boolean(p.has_variants),
  };
}

export function BestSellersClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/v1/products/products/', { params: { ordering: '-rating', limit: 12 } })
      .then((res) => {
        const data = res.data;
        const results: any[] = data?.results ?? data?.data?.results ?? [];
        setProducts(results.map(normalizeProduct));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-shell py-6 sm:py-10">
      <div className="mb-7">
        <span className="section-label mb-3">Most loved</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Best Sellers
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--brand-text-secondary)' }}>
          The products Kenyan parents can&apos;t stop raving about.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl border animate-pulse" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
              <div className="aspect-[4/5]" style={{ background: 'var(--brand-warm)' }} />
              <div className="p-4 space-y-2">
                <div className="h-3 w-3/4" style={{ background: 'var(--brand-warm)' }} />
                <div className="h-3 w-1/2" style={{ background: 'var(--brand-warm)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
