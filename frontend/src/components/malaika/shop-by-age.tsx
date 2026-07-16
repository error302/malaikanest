'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Baby } from 'lucide-react';

const AGES = [
  { name: 'Newborn', range: '0–1 mo' },
  { name: '0–3 Months', range: 'Tiny' },
  { name: '3–6 Months', range: 'Growing' },
  { name: '6–9 Months', range: 'Active' },
  { name: '9–12 Months', range: 'Cruising' },
  { name: '1–2 Years', range: 'Walking' },
  { name: '2–4 Years', range: 'Talking' },
  { name: '4–6 Years', range: 'Playful' },
  { name: '6–9 Years', range: 'School' },
  { name: '9–12 Years', range: 'Big kid' },
];

interface ShopByAgeProps {
  content?: Record<string, Record<string, string>>;
}

export function ShopByAge({ content }: ShopByAgeProps) {
  const c = content?.shop_by_age || {};
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
            <span className="section-label mb-3">{c.label || 'Find the perfect size'}</span>
            <h2
              className="font-serif font-semibold tracking-tight mt-3"
              style={{
                color: 'var(--brand-text)',
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                lineHeight: 1.15,
              }}
            >
              {c.title || 'Shop by Age'}
            </h2>
            <p
              className="mt-2 text-sm max-w-md"
              style={{ color: 'var(--brand-text-secondary)' }}
            >
              {c.subtitle || 'From newborn snuggles to first-day-of-school fits — we have got every stage covered.'}
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
              key={age.name}
              href="/categories"
              className="group flex-shrink-0 flex flex-col items-center justify-center text-center gap-2 p-5 sm:p-6 rounded-2xl border transition-all duration-300 hover:shadow-warm-md min-w-[120px] sm:min-w-[140px]"
              role="listitem"
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
                  {age.name}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider mt-0.5"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  {age.range}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
