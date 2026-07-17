'use client';

import Link from 'next/link';
import { Shirt, Package, Home, Gamepad2, Car, Gift, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const CATEGORIES = [
  {
    nameKey: 'cat.clothing',
    descKey: 'cat.clothingDesc',
    Icon: Shirt,
    color: 'linear-gradient(135deg, #FCE7E1 0%, #F8D5C9 100%)',
    countKey: 'cat.clothingCount',
  },
  {
    nameKey: 'cat.feeding',
    descKey: 'cat.feedingDesc',
    Icon: Package,
    color: 'linear-gradient(135deg, #FEF3DC 0%, #F8E5B8 100%)',
    countKey: 'cat.feedingCount',
  },
  {
    nameKey: 'cat.nursery',
    descKey: 'cat.nurseryDesc',
    Icon: Home,
    color: 'linear-gradient(135deg, #E1EEF8 0%, #C5DCF0 100%)',
    countKey: 'cat.nurseryCount',
  },
  {
    nameKey: 'cat.toys',
    descKey: 'cat.toysDesc',
    Icon: Gamepad2,
    color: 'linear-gradient(135deg, #EFE3F8 0%, #D8C2EE 100%)',
    countKey: 'cat.toysCount',
  },
  {
    nameKey: 'cat.travel',
    descKey: 'cat.travelDesc',
    Icon: Car,
    color: 'linear-gradient(135deg, #E1F4E8 0%, #BFE6CC 100%)',
    countKey: 'cat.travelCount',
  },
  {
    nameKey: 'cat.books',
    descKey: 'cat.booksDesc',
    Icon: Gift,
    color: 'linear-gradient(135deg, #FCE1EE 0%, #F8C5D8 100%)',
    countKey: 'cat.booksCount',
  },
];

interface CategoryQuickLinksProps {
  content?: Record<string, Record<string, string>>;
}

export function CategoryQuickLinks({ content }: CategoryQuickLinksProps) {
  const { t } = useI18n();
  const c = content?.categories || {};
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
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.nameKey}
              href="/categories"
              className="group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-warm-md hover:-translate-y-1"
              style={{
                background: '#FFFFFF',
                borderColor: 'var(--brand-border)',
              }}
            >
              <div
                className="aspect-square flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                style={{ background: cat.color }}
              >
                <cat.Icon
                  size={40}
                  strokeWidth={1.4}
                  style={{ color: 'var(--brand-gold)' }}
                />
              </div>
              <div className="p-3 sm:p-4">
                <div
                  className="text-[13px] sm:text-[14px] font-semibold leading-tight"
                  style={{ color: 'var(--brand-text)' }}
                >
                  {t(cat.nameKey)}
                </div>
                <div
                  className="text-[11px] mt-1 leading-snug line-clamp-2"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  {t(cat.descKey)}
                </div>
                <div
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium"
                  style={{ color: 'var(--brand-gold)' }}
                >
                  {t(cat.countKey)}
                  <ChevronRight
                    size={12}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
