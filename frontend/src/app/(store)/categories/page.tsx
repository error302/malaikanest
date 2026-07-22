'use client';

import { Suspense } from 'react';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductCard, type Product } from '@/components/malaika/product-card';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/media';

const AGE_GROUPS = [
  { label: 'All ages', value: '' },
  { label: 'Baby (0-2)', value: 'baby' },
  { label: 'Toddler (2-5)', value: 'toddler' },
  { label: 'Kids (6-12)', value: 'kids' },
];

const SORT_OPTIONS = [
  { label: 'Newest', value: '-created_at' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Most Popular', value: '-rating' },
];

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

export default function CategoriesPage() {
  // useSearchParams needs a Suspense boundary in the App Router (Next 14+.
  // We wrap the page's interactive body in <Suspense> so the rest of the
  // storefront (header, footer, marketing blocks) renders without the
  // bail-out forcing a full client-only tree.
  return (
    <Suspense fallback={null}>
      <CategoriesBrowser />
    </Suspense>
  );
}

function CategoriesBrowser() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [ageGroup, setAgeGroup] = useState('');
  const [gender, setGender] = useState('');
  const [sort, setSort] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const search = searchParams.get('search') || '';
  const age = searchParams.get('age') || '';
  const categorySlug = searchParams.get('category') || '';

  useEffect(() => {
    let cancelled = false;
    const params: Record<string, string> = {
      ordering: sort,
      page: String(page),
      page_size: '24',
    };
    if (search) params.search = search;
    if (age || ageGroup) params.age_group = ageGroup || age;
    if (gender) params.gender = gender;
    if (categorySlug) params.category = categorySlug;

    const load = async () => {
      try {
        const res = await api.get('/api/v1/products/products/', { params });
        if (cancelled) return;
        const data = res.data;
        const results: any[] = data?.results ?? data?.data?.results ?? [];
        const normalized = results.map(normalizeProduct);
        setProducts(normalized);
        setHasMore(Boolean(data?.next));
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    load();
    return () => { cancelled = true; };
  }, [search, age, ageGroup, gender, categorySlug, sort, page]);

  return (
    <div className="container-shell py-6 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          {search ? `Results for "${search}"` : 'All Products'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
          {loading ? 'Loading…' : `${products.length} item${products.length === 1 ? '' : 's'} found`}
        </p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Filters - desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Filters</h2>
            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Age Group</label>
                <div className="space-y-1">
                  {AGE_GROUPS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAgeGroup(opt.value)}
                      className="block w-full text-left text-sm px-3 py-2 min-h-[44px] flex items-center rounded-lg transition-colors"
                      style={{
                        background: ageGroup === opt.value ? 'var(--brand-warm)' : 'transparent',
                        color: ageGroup === opt.value ? 'var(--brand-gold)' : 'var(--brand-brown)',
                        fontWeight: ageGroup === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Gender</label>
                <div className="space-y-1">
                  {[{ label: 'All', value: '' }, { label: 'Boys', value: 'boy' }, { label: 'Girls', value: 'girl' }, { label: 'Unisex', value: 'unisex' }].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      className="block w-full text-left text-sm px-3 py-2 min-h-[44px] flex items-center rounded-lg transition-colors"
                      style={{
                        background: gender === opt.value ? 'var(--brand-warm)' : 'transparent',
                        color: gender === opt.value ? 'var(--brand-gold)' : 'var(--brand-brown)',
                        fontWeight: gender === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm"
              style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="ml-auto text-sm rounded-full px-4 py-2 border"
              style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="rounded-2xl border animate-pulse" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
                  <div className="aspect-[4/5]" style={{ background: 'var(--brand-warm)' }} />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-3/4" style={{ background: 'var(--brand-warm)' }} />
                    <div className="h-3 w-1/2" style={{ background: 'var(--brand-warm)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium"
                    style={{ borderColor: 'var(--brand-gold)', color: 'var(--brand-gold)' }}
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-[200] lg:hidden" style={{ background: 'rgba(44,24,16,0.5)' }} onClick={() => setShowFilters(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85%] p-5 overflow-y-auto" style={{ background: 'var(--brand-cream)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold" style={{ color: 'var(--brand-text)' }}>Filters</h2>
              <button type="button" onClick={() => setShowFilters(false)} aria-label="Close filters">
                <X size={20} style={{ color: 'var(--brand-brown)' }} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Age Group</label>
                <div className="space-y-1">
                  {AGE_GROUPS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setAgeGroup(opt.value)} className="block w-full text-left text-sm px-3 py-2 min-h-[44px] flex items-center rounded-lg" style={{ background: ageGroup === opt.value ? 'var(--brand-warm)' : 'transparent', color: ageGroup === opt.value ? 'var(--brand-gold)' : 'var(--brand-brown)' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Gender</label>
                <div className="space-y-1">
                  {[{ label: 'All', value: '' }, { label: 'Boys', value: 'boy' }, { label: 'Girls', value: 'girl' }, { label: 'Unisex', value: 'unisex' }].map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setGender(opt.value)} className="block w-full text-left text-sm px-3 py-2 min-h-[44px] flex items-center rounded-lg" style={{ background: gender === opt.value ? 'var(--brand-warm)' : 'transparent', color: gender === opt.value ? 'var(--brand-gold)' : 'var(--brand-brown)' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => setShowFilters(false)} className="w-full rounded-full px-6 py-3 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
