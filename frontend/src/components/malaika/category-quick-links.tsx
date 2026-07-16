'use client';

import Link from 'next/link';
import { Shirt, Package, Home, Gamepad2, Car, Gift, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  {
    name: 'Clothing',
    desc: 'Onesies, rompers, dresses & more',
    Icon: Shirt,
    color: 'linear-gradient(135deg, #FCE7E1 0%, #F8D5C9 100%)',
    count: '120+ items',
  },
  {
    name: 'Baby Essentials',
    desc: 'Feeding, bathing & daily care',
    Icon: Package,
    color: 'linear-gradient(135deg, #FEF3DC 0%, #F8E5B8 100%)',
    count: '85+ items',
  },
  {
    name: 'Nursery',
    desc: 'Furniture, bedding & decor',
    Icon: Home,
    color: 'linear-gradient(135deg, #E1EEF8 0%, #C5DCF0 100%)',
    count: '64+ items',
  },
  {
    name: 'Toys & Learning',
    desc: 'Play, explore & grow',
    Icon: Gamepad2,
    color: 'linear-gradient(135deg, #EFE3F8 0%, #D8C2EE 100%)',
    count: '92+ items',
  },
  {
    name: 'Travel & Safety',
    desc: 'Strollers, carriers & safety',
    Icon: Car,
    color: 'linear-gradient(135deg, #E1F4E8 0%, #BFE6CC 100%)',
    count: '48+ items',
  },
  {
    name: 'Gift Sets',
    desc: 'Curated bundles for every occasion',
    Icon: Gift,
    color: 'linear-gradient(135deg, #FCE1EE 0%, #F8C5D8 100%)',
    count: '36+ items',
  },
];

interface CategoryQuickLinksProps {
  content?: Record<string, Record<string, string>>;
}

export function CategoryQuickLinks({ content }: CategoryQuickLinksProps) {
  const c = content?.categories || {};
  return (
    <section
      id="shop"
      className="py-12 sm:py-16 lg:py-20"
      style={{ background: 'var(--brand-cream)' }}
    >
      <div className="container-shell">
        <div className="text-center max-w-2xl mx-auto mb-9 sm:mb-12">
          <span className="section-label mb-3 justify-center">{c.label || 'Browse collections'}</span>
          <h2
            className="font-serif font-semibold tracking-tight mt-3"
            style={{
              color: 'var(--brand-text)',
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              lineHeight: 1.15,
            }}
          >
            {c.title || 'Curated Categories'}
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--brand-text-secondary)' }}
          >
            {c.subtitle || 'Thoughtfully selected for every moment of your baby\'s journey.'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
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
                  {cat.name}
                </div>
                <div
                  className="text-[11px] mt-1 leading-snug line-clamp-2"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  {cat.desc}
                </div>
                <div
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium"
                  style={{ color: 'var(--brand-gold)' }}
                >
                  {cat.count}
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
