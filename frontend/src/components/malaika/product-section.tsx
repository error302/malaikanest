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
  columns?: 4 | 3;
  background?: 'cream' | 'bg-alt' | 'white';
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
}: ProductSectionProps) {
  const { t } = useI18n();
  const viewAll = viewAllLabel ?? t('section.viewAll');
  const bgMap = {
    cream: '#FFFFFF',
    'bg-alt': 'var(--brand-bg-alt)',
    white: '#FFFFFF',
  };

  const colClass =
    columns === 4
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      : 'grid-cols-2 md:grid-cols-3';
  const genericLabels = ['see more', 'view all', 'view all products', 'see all'];
  const isGeneric = genericLabels.includes(viewAll.trim().toLowerCase());
  const viewAllText = isGeneric ? `View All ${title}` : viewAll;

  return (
    <section
      id={id}
      className="py-12 sm:py-16 lg:py-20"
      style={{ background: bgMap[background] }}
    >
      <div className="container-shell">
        <div className="flex items-end justify-between gap-4 mb-7 sm:mb-9">
          <div>
            <span className="section-label mb-3">{label}</span>
            <h2
              className="font-serif font-semibold tracking-tight mt-3"
              style={{
                color: 'var(--brand-text)',
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
            style={{ color: 'var(--brand-gold)' }}
          >
            {viewAllText}
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className={`grid ${colClass} gap-x-4 gap-y-8 sm:gap-x-6 lg:gap-x-8`}>
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        {/* Mobile view-all */}
        <div className="mt-7 text-center sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-[13px] font-medium px-6 py-3 rounded-full border"
            style={{
              borderColor: 'var(--brand-gold)',
              color: 'var(--brand-gold)',
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
