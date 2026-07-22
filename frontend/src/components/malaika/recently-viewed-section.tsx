'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Clock } from 'lucide-react';
import { getRecentlyViewed, clearRecentlyViewed, type RecentlyViewedItem } from '@/lib/recently-viewed';
import { getImageUrl } from '@/lib/media';

/**
 * Shows recently viewed products on the homepage.
 * Reads from localStorage on client mount (avoids SSR mismatch).
 */
export function RecentlyViewedSection() {
  // Read on first client render — useState initializer avoids the effect
  const [items, setItems] = useState<RecentlyViewedItem[]>(() => {
    if (typeof window === 'undefined') return [];
    return getRecentlyViewed();
  });

  if (items.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-20" style={{ background: 'var(--brand-cream)' }}>
      <div className="container-shell">
        <div className="flex items-end justify-between gap-4 mb-7 sm:mb-9">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <Clock size={14} style={{ color: 'var(--brand-gold)' }} />
              <span className="text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--brand-gold)' }}>
                Pick up where you left off
              </span>
            </div>
            <h2 className="font-serif font-semibold tracking-tight" style={{
              color: 'var(--brand-text)',
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              lineHeight: 1.15,
            }}>
              Recently Viewed
            </h2>
          </div>
          <button
            type="button"
            onClick={() => { clearRecentlyViewed(); setItems([]); }}
            className="inline-flex items-center gap-1 text-xs hover:underline"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            <X size={12} /> Clear
          </button>
        </div>

        <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/products/${item.slug}`}
              className="group flex-shrink-0 w-40 sm:w-48 rounded-2xl border overflow-hidden transition-all hover:shadow-warm-md"
              style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
            >
              <div className="aspect-[4/5] overflow-hidden relative" style={{ background: 'var(--brand-warm)' }}>
                {item.image ? (
                  <Image
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 160px, 192px"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-serif text-4xl opacity-20" style={{ color: 'var(--brand-gold)' }}>
                      {item.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                {item.category && (
                  <div className="text-[10px] uppercase tracking-wider font-medium mb-0.5" style={{ color: 'var(--brand-text-muted)' }}>
                    {item.category}
                  </div>
                )}
                <h3 className="text-xs font-semibold line-clamp-2 mb-1" style={{ color: 'var(--brand-text)' }}>
                  {item.name}
                </h3>
                <p className="text-sm font-semibold" style={{ color: 'var(--brand-gold)' }}>
                  KES {item.price.toLocaleString('en-KE')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
