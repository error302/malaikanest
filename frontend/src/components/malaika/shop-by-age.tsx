'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Baby } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const AGES = [
  { name: 'Newborn', nameKey: 'age.newborn', rangeKey: 'age.newbornRange' },
  { name: '0–3 Months', nameKey: 'age.0_3', rangeKey: 'age.0_3Range' },
  { name: '3–6 Months', nameKey: 'age.3_6', rangeKey: 'age.3_6Range' },
  { name: '6–9 Months', nameKey: 'age.6_9', rangeKey: 'age.6_9Range' },
  { name: '9–12 Months', nameKey: 'age.9_12', rangeKey: 'age.9_12Range' },
  { name: '1–2 Years', nameKey: 'age.1_2', rangeKey: 'age.1_2Range' },
  { name: '2–4 Years', nameKey: 'age.2_4', rangeKey: 'age.2_4Range' },
  { name: '4–6 Years', nameKey: 'age.4_6', rangeKey: 'age.4_6Range' },
  { name: '6–9 Years', nameKey: 'age.6_9y', rangeKey: 'age.6_9yRange' },
  { name: '9–12 Years', nameKey: 'age.9_12y', rangeKey: 'age.9_12yRange' },
];

interface ShopByAgeProps {
  content?: Record<string, Record<string, string>>;
}

export function ShopByAge({ content }: ShopByAgeProps) {
  const c = content?.shop_by_age || {};
  const { t } = useI18n();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.75, 560);
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section
      id="shop-by-age"
      className="py-12 sm:py-16 lg:py-20"
      style={{ background: 'var(--brand-bg-alt)' }}
    >
      <div className="container-shell">
        <div className="flex items-end justify-between gap-4 mb-7 sm:mb-9">
          <div>
            <span className="section-label mb-3">{c.label || t('home.shopByAge')}</span>
            <h2
              className="font-serif font-semibold tracking-tight mt-3"
              style={{
                color: 'var(--brand-text)',
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                lineHeight: 1.15,
              }}
            >
              {c.title || t('home.shopByAge')}
            </h2>
            <p
              className="mt-2 text-sm max-w-md"
              style={{ color: 'var(--brand-text-secondary)' }}
            >
              {c.subtitle || t('home.shopByAgeSub')}
            </p>
          </div>

          {/* Desktop arrows */}
          <div className="hidden sm:flex gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-[var(--brand-warm)]"
              style={{
                borderColor: 'var(--brand-border)',
                color: 'var(--brand-brown)',
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:bg-[var(--brand-warm)]"
              style={{
                borderColor: 'var(--brand-border)',
                color: 'var(--brand-brown)',
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-2"
          role="list"
        >
          {AGES.map((age) => (
            <Link
              key={age.nameKey}
              href="/categories"
              className="group flex-shrink-0 flex flex-col items-center justify-center text-center gap-2 p-5 sm:p-6 rounded-2xl border transition-all duration-300 hover:shadow-warm-md min-w-[120px] sm:min-w-[140px]"
              style={{
                background: '#FFFFFF',
                borderColor: 'var(--brand-border)',
              }}
            >
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--brand-gold-soft)]"
                style={{ background: 'var(--brand-warm)' }}
              >
                <Baby
                  size={26}
                  strokeWidth={1.5}
                  style={{ color: 'var(--brand-gold)' }}
                />
              </div>
              <div>
                <div
                  className="text-[13px] sm:text-sm font-semibold whitespace-nowrap"
                  style={{ color: 'var(--brand-text)' }}
                >
                  {t(age.nameKey)}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider mt-0.5"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  {t(age.rangeKey)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
