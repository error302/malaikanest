'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCategories } from '@/lib/categoriesContext';
import { getCategoryImage } from '@/lib/category-images';

interface CategoryQuickLinksProps {
  content?: Record<string, Record<string, string>>;
}

export function CategoryQuickLinks({ content }: CategoryQuickLinksProps) {
  const { t } = useI18n();
  const c = content?.categories || {};
  const { categories: rawCategories, loading } = useCategories();

  const filtered = rawCategories.filter(
    (cat: any) => !cat.parent || cat.children !== undefined
  );
  const categories = (filtered.length > 0 ? filtered : rawCategories).slice(0, 8);

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

  const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Baby Clothing', slug: 'clothing' },
    { id: '2', name: 'Baby Essentials', slug: 'baby-essentials' },
    { id: '3', name: 'Nursery', slug: 'nursery' },
    { id: '4', name: 'Toys & Learning', slug: 'toys' },
    { id: '5', name: 'Gifts & Bundles', slug: 'gifts' },
    { id: '6', name: 'Mtumba / Thrifted', slug: 'thrifted' },
  ];

  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

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

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 sm:gap-6 justify-items-center">
          {displayCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories?category=${cat.slug}`}
              className="group flex flex-col items-center text-center w-full max-w-[130px] transition-all duration-300"
            >
              {/* Circular Avatar Container with soft gold ring & elevation */}
              <div
                className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-white p-1.5 shadow-[0_8px_20px_rgba(44,24,16,0.06)] border transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_16px_32px_rgba(196,144,74,0.2)] group-hover:border-[var(--brand-gold)] flex items-center justify-center"
                style={{ borderColor: 'var(--brand-border)' }}
              >
                <div className="w-full h-full rounded-full overflow-hidden relative bg-[var(--brand-warm)]">
                  <Image
                    src={getCategoryImage(cat)}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 112px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                </div>
              </div>

              {/* Category Name & Count */}
              <h3
                className="mt-3 text-xs sm:text-sm font-semibold tracking-tight transition-colors duration-300 line-clamp-1 group-hover:text-[var(--brand-gold)]"
                style={{ color: 'var(--brand-text)' }}
              >
                {cat.name}
              </h3>
              {cat.product_count !== undefined && (
                <span
                  className="mt-1 inline-flex items-center text-[10px] sm:text-[11px] font-medium tracking-wide opacity-80"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  {(cat.product_count ?? 0) === 1 ? '1 item' : `${cat.product_count ?? 0} items`}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
