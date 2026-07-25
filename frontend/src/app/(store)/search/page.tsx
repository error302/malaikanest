'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon, TrendingUp, Loader2 } from 'lucide-react';
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
    inStock: (p.available_stock ?? p.stock ?? 0) > 0,
    hasVariants: Boolean(p.has_variants),
    variantCount: typeof p.variant_count === 'number' ? p.variant_count : 0,
  };
}

const POPULAR_SEARCHES = ['Onesie', 'Newborn', 'Stroller', 'Feeding', 'Cotton', 'Thrifted'];
const RECENT_STORAGE_KEY = 'malaika_recent_searches_v1';
const MAX_RECENT = 5;

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchBrowser />
    </Suspense>
  );
}

function SearchBrowser() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get('q') || '';
  const [query, setQuery] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
    // auto-focus
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Persist + search when the URL `q` is set
  useEffect(() => {
    const q = params.get('q') || '';
    setQuery(q);
    setSubmitted(q);
    if (q.trim()) runSearch(q);
  }, [params]);

  const runSearch = async (q: string) => {
    const term = q.trim();
    if (!term) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/api/v1/products/products/', {
        params: { search: term, page_size: 24 },
      });
      const data = res.data;
      const results = data?.results ?? data?.data?.results ?? [];
      setProducts(results.map(normalizeProduct));
      saveRecent(term);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const saveRecent = (term: string) => {
    try {
      const cleaned = term.trim();
      if (!cleaned) return;
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [cleaned, ...list.filter((t) => t.toLowerCase() !== cleaned.toLowerCase())].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      setRecent(next);
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    router.replace(`/search?q=${encodeURIComponent(term)}`);
    setSubmitted(term);
    runSearch(term);
  };

  const handlePickRecent = (term: string) => {
    setQuery(term);
    router.replace(`/search?q=${encodeURIComponent(term)}`);
    setSubmitted(term);
    runSearch(term);
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_STORAGE_KEY);
      setRecent([]);
    } catch {}
  };

  return (
    <div className="container-shell py-6 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <h1
          className="font-serif text-3xl sm:text-4xl font-semibold mb-2 text-center"
          style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
        >
          What are you looking for?
        </h1>
        <p className="text-sm text-center mb-6" style={{ color: 'var(--brand-text-muted)' }}>
          Search across our full catalog of baby essentials, nursery, gifts and more.
        </p>

        <form onSubmit={handleSubmit} role="search" className="relative mb-8">
          <SearchIcon
            size={18}
            className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--brand-text-muted)' }}
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, categories…"
            aria-label="Search products"
            className="w-full rounded-full pl-14 pr-32 py-4 text-[15px] sm:text-base transition-colors"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--brand-border)',
              color: 'var(--brand-text)',
              boxShadow: 'var(--shadow-warm-sm)',
            }}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6 py-2.5 text-[13px] font-medium uppercase tracking-[0.1em] transition-colors"
            style={{ background: 'var(--brand-brown)', color: '#FFFFFF' }}
          >
            Search
          </button>
        </form>

        {!submitted && (
          <div className="space-y-8">
            {recent.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--brand-text-muted)' }}>
                    Recent searches
                  </h2>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="text-[11px] underline"
                    style={{ color: 'var(--brand-text-muted)' }}
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handlePickRecent(term)}
                      className="text-sm px-4 py-2 rounded-full border transition-colors"
                      style={{
                        background: '#FFFFFF',
                        borderColor: 'var(--brand-border)',
                        color: 'var(--brand-text)',
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} style={{ color: 'var(--brand-gold)' }} />
                <h2 className="text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--brand-text-muted)' }}>
                  Popular searches
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handlePickRecent(term)}
                    className="text-sm px-4 py-2 rounded-full transition-colors"
                    style={{
                      background: 'var(--brand-bg-alt)',
                      color: 'var(--brand-brown)',
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {submitted && (
          <div>
            <p
              className="text-sm mb-5"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Searching for &ldquo;{submitted}&rdquo;…
                </span>
              ) : (
                <>{products.length} result{products.length === 1 ? '' : 's'} for &ldquo;{submitted}&rdquo;</>
              )}
            </p>
            {products.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 lg:gap-x-8">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
            {!loading && products.length === 0 && (
              <div className="text-center py-16">
                <p className="font-serif text-2xl mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
                  Nothing found
                </p>
                <p className="text-sm mb-6" style={{ color: 'var(--brand-text-muted)' }}>
                  Try a different word, or browse the catalog.
                </p>
                <a
                  href="/categories"
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium uppercase tracking-[0.1em]"
                  style={{ background: 'var(--brand-brown)', color: '#FFFFFF' }}
                >
                  Browse all
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
