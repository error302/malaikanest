'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const AGES = [
  { name: 'Newborn', nameKey: 'age.newborn', rangeKey: 'age.newbornRange', group: 'baby', image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=300&auto=format&fit=crop&q=80' },
  { name: '0–3 Months', nameKey: 'age.0_3', rangeKey: 'age.0_3Range', group: 'baby', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&auto=format&fit=crop&q=80' },
  { name: '3–6 Months', nameKey: 'age.3_6', rangeKey: 'age.3_6Range', group: 'baby', image: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=300&auto=format&fit=crop&q=80' },
  { name: '6–9 Months', nameKey: 'age.6_9', rangeKey: 'age.6_9Range', group: 'baby', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&auto=format&fit=crop&q=80' },
  { name: '9–12 Months', nameKey: 'age.9_12', rangeKey: 'age.9_12Range', group: 'baby', image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=300&auto=format&fit=crop&q=80' },
  { name: '1–2 Years', nameKey: 'age.1_2', rangeKey: 'age.1_2Range', group: 'baby', image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=300&auto=format&fit=crop&q=80' },
  { name: '2–4 Years', nameKey: 'age.2_4', rangeKey: 'age.2_4Range', group: 'toddler', image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80' },
  { name: '4–6 Years', nameKey: 'age.4_6', rangeKey: 'age.4_6Range', group: 'toddler', image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=300&auto=format&fit=crop&q=80' },
  { name: '6–9 Years', nameKey: 'age.6_9y', rangeKey: 'age.6_9yRange', group: 'kids', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&auto=format&fit=crop&q=80' },
  { name: '9–12 Years', nameKey: 'age.9_12y', rangeKey: 'age.9_12yRange', group: 'kids', image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=300&auto=format&fit=crop&q=80' },
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
            <div key={age.nameKey} role="listitem" className="flex-shrink-0">
            <Link
              key={age.nameKey}
              href={`/categories?age=${age.group}`}
              className="group flex flex-col items-center justify-center text-center gap-2.5 p-5 sm:p-6 rounded-2xl border transition-all duration-300 hover:shadow-warm-md min-w-[120px] sm:min-w-[140px]"
              style={{
                background: '#FFFFFF',
                borderColor: 'var(--brand-border)',
              }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden relative border-2 border-white shadow-warm-sm transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={age.image}
                  alt={t(age.nameKey)}
                  fill
                  sizes="(max-width: 640px) 56px, 64px"
                  className="object-cover"
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
