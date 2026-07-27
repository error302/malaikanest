'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import api from '@/lib/api';

/* ── Pastel gradient palette for cards without uploaded images ── */
const FALLBACK_COLORS = [
  'linear-gradient(135deg, #FCE7E1 0%, #F8D5C9 100%)',
  'linear-gradient(135deg, #FEF3DC 0%, #F8E5B8 100%)',
  'linear-gradient(135deg, #E1EEF8 0%, #C5DCF0 100%)',
  'linear-gradient(135deg, #EFE3F8 0%, #D8C2EE 100%)',
  'linear-gradient(135deg, #E1F4E8 0%, #BFE6CC 100%)',
  'linear-gradient(135deg, #FCE1EE 0%, #F8C5D8 100%)',
];

interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  full_slug?: string;
  image?: string | null;
  product_count?: number;
  children?: ApiCategory[];
}

interface CategoryQuickLinksProps {
  content?: Record<string, Record<string, string>>;
}

export function CategoryQuickLinks({ content }: CategoryQuickLinksProps) {
  const { t } = useI18n();
  const c = content?.categories || {};

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/v1/products/categories/')
      .then((res) => {
        const data = res.data;
        const results: ApiCategory[] = data?.results ?? data?.data?.results ?? (Array.isArray(data) ? data : []);
        // Only show top-level (root) categories
        setCategories(results.filter((cat: ApiCategory) => !('parent' in cat) || cat.children !== undefined || results.length <= 8));
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading && categories.length === 0) {
    return (
      <section id="shop" className="py-12 sm:py-16 lg:py-20" style={{ background: 'var(--brand-cream)' }}>
        <div className="container-shell">
          <div className="text-center max-w-2xl mx-auto mb-9 sm:mb-12">
            <span className="section-label mb-3 justify-center">{c.label || t('cat.categoriesLabel')}</span>
            <h2
              className="font-serif font-semibold tracking-tight mt-3"
              style={{
                color: 'var(--brand-text)',
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                lineHeight: 1.15,
              }}
            >
              {c.title || t('cat.categoriesTitle')}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden border animate-pulse"
                style={{ borderColor: 'var(--brand-border)' }}
              >
                <div className="aspect-square" style={{ background: 'var(--brand-warm)' }} />
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-3 rounded" style={{ background: 'var(--brand-warm)', width: '60%' }} />
                  <div className="h-2 rounded" style={{ background: 'var(--brand-warm)', width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section
      id="shop"
      className="py-12 sm:py-16 lg:py-20"
      style={{ background: 'var(--brand-cream)' }}
    >
      <div className="container-shell">
        <div className="text-center max-w-2xl mx-auto mb-9 sm:mb-12">
          <span className="section-label mb-3 justify-center">{c.label || t('cat.categoriesLabel')}</span>
          <h2
            className="font-serif font-semibold tracking-tight mt-3"
            style={{
              color: 'var(--brand-text)',
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              lineHeight: 1.15,
            }}
          >
            {c.title || t('cat.categoriesTitle')}
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--brand-text-secondary)' }}
          >
            {c.subtitle || t('cat.categoriesSub')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/categories?category=${cat.slug}`}
              className="group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-warm-md hover:-translate-y-1"
              style={{
                background: '#FFFFFF',
                borderColor: 'var(--brand-border)',
              }}
            >
              <div
                className="aspect-square flex items-center justify-center transition-transform duration-300 group-hover:scale-105 relative overflow-hidden"
                style={{ background: cat.image ? undefined : FALLBACK_COLORS[idx % FALLBACK_COLORS.length] }}
              >
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover"
                  />
                ) : (
                  <Package
                    size={40}
                    strokeWidth={1.4}
                    style={{ color: 'var(--brand-gold)' }}
                  />
                )}
              </div>
              <div className="p-3 sm:p-4">
                <div
                  className="text-[13px] sm:text-[14px] font-semibold leading-tight"
                  style={{ color: 'var(--brand-text)' }}
                >
                  {cat.name}
                </div>
                {cat.product_count !== undefined && (
                  <div
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium"
                    style={{ color: 'var(--brand-gold)' }}
                  >
                    {cat.product_count} items
                    <ChevronRight
                      size={12}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
