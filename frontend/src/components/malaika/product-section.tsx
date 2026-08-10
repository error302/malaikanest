'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ProductCard, type Product } from './product-card';
import { useI18n } from '@/lib/i18n';

interface ProductSectionProps {
  id?: string;
  label: string;
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  products: Product[];
  columns?: 4 | 3 | 5;
  background?: 'cream' | 'bg-alt' | 'white' | 'paper' | 'paper-alt' | 'paper-card';
  /**
   * Layout mode. `grid` (default) keeps the existing responsive grid behavior.
   * `masonry` uses CSS columns for a Pinterest-style packed layout — the
   * `masonry` class is defined in globals.css. `carousel` is reserved for
   * future horizontal-scroll layout (not yet implemented; falls back to grid).
   */
  layout?: 'grid' | 'masonry' | 'carousel';
}

export function ProductSection({
  id,
  label,
  title,
  viewAllHref = '#shop',
  viewAllLabel,
  products,
  columns = 4,
  background = 'cream',
  layout = 'grid',
}: ProductSectionProps) {
  const { t } = useI18n();
  const viewAll = viewAllLabel ?? t('section.viewAll');

  // Map legacy background names + new editorial names to the same set of values.
  // `cream`/`white` -> paper-card (white); `bg-alt` -> paper-alt; new tokens map direct.
  const bgMap: Record<string, string> = {
    cream: 'var(--paper-card)',
    'bg-alt': 'var(--paper-alt)',
    white: 'var(--paper-card)',
    paper: 'var(--paper)',
    'paper-alt': 'var(--paper-alt)',
    'paper-card': 'var(--paper-card)',
  };

  // Grid column classes — supports 3, 4 (default), and 5 (extra-wide screens).
  const colClass =
    columns === 5
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      : columns === 4
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      : 'grid-cols-2 md:grid-cols-3';

  const genericLabels = ['see more', 'view all', 'view all products', 'see all'];
  const isGeneric = genericLabels.includes(viewAll.trim().toLowerCase());
  const viewAllText = isGeneric ? `View All ${title}` : viewAll;

  if (products.length === 0) return null;

  return (
    <section
      id={id}
      className="py-12 sm:py-16 lg:py-20"
      style={{ background: bgMap[background] ?? bgMap.cream }}
    >
      <div className="container-shell">
        <div className="flex items-end justify-between gap-4 mb-7 sm:mb-9">
          <div>
            <span className="section-label mb-3">{label}</span>
            <h2
              className="font-serif font-semibold tracking-tight mt-3"
              style={{
                color: 'var(--ink)',
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                lineHeight: 1.15,
              }}
            >
              {title}
            </h2>
          </div>
          <Link
            href={viewAllHref}
            className="hidden sm:inline-flex items-center gap-1 text-[13px] font-medium transition-all hover:gap-2 min-h-[44px]"
            style={{ color: 'var(--accent)' }}
          >
            {viewAllText}
            <ChevronRight size={14} />
          </Link>
        </div>

        {layout === 'masonry' ? (
          <div className="masonry">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className={`grid ${colClass} gap-x-4 gap-y-8 sm:gap-x-6 lg:gap-x-8`}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}

        {/* Mobile view-all */}
        <div className="mt-7 text-center sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-[13px] font-medium px-6 py-3 rounded-full border"
            style={{
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
            }}
          >
            {viewAllText}
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
