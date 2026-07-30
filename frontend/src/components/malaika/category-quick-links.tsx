'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCategories } from '@/lib/categoriesContext';

/* ── Pastel gradient palette for cards without uploaded images ── */
const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  clothing: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=80',
  feeding: 'https://images.unsplash.com/photo-1584839627923-d58f3e829da6?w=500&auto=format&fit=crop&q=80',
  nursery: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&auto=format&fit=crop&q=80',
  toys: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop&q=80',
  travel: 'https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?w=500&auto=format&fit=crop&q=80',
  books: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80',
  gifts: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80',
  thrifted: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500&auto=format&fit=crop&q=80',
};

const FALLBACK_PHOTO_ARRAY = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584839627923-d58f3e829da6?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80',
];

function getCategoryPhoto(cat: { name: string; image?: string | null }, idx: number): string {
  if (cat.image) return cat.image;
  const name = cat.name.toLowerCase();
  for (const [key, url] of Object.entries(DEFAULT_CATEGORY_IMAGES)) {
    if (name.includes(key)) return url;
  }
  return FALLBACK_PHOTO_ARRAY[idx % FALLBACK_PHOTO_ARRAY.length];
}

interface CategoryQuickLinksProps {
  content?: Record<string, Record<string, string>>;
}

export function CategoryQuickLinks({ content }: CategoryQuickLinksProps) {
  const { t } = useI18n();
  const c = content?.categories || {};
  const { categories: rawCategories, loading } = useCategories();

  const categories = rawCategories.filter(
    (cat: any) => !cat.parent || cat.children !== undefined || rawCategories.length <= 8
  );

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
              <div className="aspect-square flex items-center justify-center transition-transform duration-300 group-hover:scale-105 relative overflow-hidden">
                <Image
                  src={getCategoryPhoto(cat, idx)}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover"
                />
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
                    {(cat.product_count ?? 0) === 1 ? '1 item' : `${cat.product_count ?? 0} items`}
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
