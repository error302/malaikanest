'use client';

import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';
import { ThriftedCard } from '@/components/malaika/thrifted-card';
import type { ThriftedProduct } from '@/lib/thrifted';

interface ThriftedSectionProps {
  products: ThriftedProduct[];
}

export function ThriftedSection({ products }: ThriftedSectionProps) {
  if (products.length === 0) return null;

  return (
    <section
      id="thrifted"
      className="py-12 sm:py-16 lg:py-20"
      style={{
        background: 'linear-gradient(180deg, var(--brand-cream) 0%, var(--brand-bg-alt) 100%)',
      }}
    >
      <div className="container-shell">
        <div className="flex items-end justify-between gap-4 mb-7 sm:mb-9">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3" style={{ background: 'rgba(196,112,74,0.12)' }}>
              <Sparkles size={14} style={{ color: 'var(--brand-terra)' }} />
              <span className="text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--brand-terra)' }}>
                Mtumba · Thrifted
              </span>
            </div>
            <h2
              className="font-serif font-semibold tracking-tight"
              style={{
                color: 'var(--brand-text)',
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                lineHeight: 1.15,
              }}
            >
              Pre-loved Treasures
            </h2>
            <p className="mt-2 text-sm max-w-md" style={{ color: 'var(--brand-text-secondary)' }}>
              Gently-used premium baby & kids clothing at a fraction of the price. Each item is one-of-a-kind.
            </p>
          </div>
          <Link
            href="/thrifted"
            className="hidden sm:inline-flex items-center gap-1 text-[13px] font-medium transition-all hover:gap-2"
            style={{ color: 'var(--brand-terra)' }}
          >
            Browse All <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((p, i) => (
            <ThriftedCard key={p.id} product={p} index={i} />
          ))}
        </div>

        <div className="mt-7 text-center sm:hidden">
          <Link
            href="/thrifted"
            className="inline-flex items-center gap-1 text-[13px] font-medium px-6 py-3 rounded-full border"
            style={{ borderColor: 'var(--brand-terra)', color: 'var(--brand-terra)' }}
          >
            Browse All Mtumba <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
