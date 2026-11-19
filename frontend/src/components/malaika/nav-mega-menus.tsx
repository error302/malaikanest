'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Sparkles, Gift, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { getCategoryImage } from '@/lib/category-images';

interface NavMegaMenusProps {
  shopOpen: boolean;
  shopTouched: boolean;
  openShop: () => void;
  closeShop: () => void;
  setShopOpen: (open: boolean) => void;
  ageOpen: boolean;
  ageTouched: boolean;
  openAge: () => void;
  closeAge: () => void;
  setAgeOpen: (open: boolean) => void;
  categories: any[];
  fallbackColors: string[];
  shopByAge: { label: string; slug: string; image: string }[];
}

export function NavMegaMenus({
  shopOpen,
  shopTouched,
  openShop,
  closeShop,
  setShopOpen,
  ageOpen,
  ageTouched,
  openAge,
  closeAge,
  setAgeOpen,
  categories,
  fallbackColors,
  shopByAge,
}: NavMegaMenusProps) {
  const { t } = useI18n();

  return (
    <>
      {/* ── Shop Mega Menu ── */}
      <div
        onMouseEnter={openShop}
        onMouseLeave={closeShop}
        className={`hidden lg:block absolute top-full left-0 right-0 z-50 transition-all duration-200 origin-top ${
          shopOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid var(--brand-border)',
          boxShadow: 'var(--shadow-warm-lg)',
        }}
      >
        {shopTouched && (
          <div className="container-shell py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((cat, idx) => (
                <Link
                  key={cat.id}
                  href={cat.slug ? `/categories?category=${cat.slug}` : '/categories'}
                  onClick={() => setShopOpen(false)}
                  className="group flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden hover:shadow-warm-md"
                  style={{
                    borderColor: 'var(--brand-border)',
                    background: '#FFFFFF',
                  }}
                >
                  <div
                    className="h-24 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 relative"
                    style={{ background: fallbackColors[idx % fallbackColors.length] }}
                  >
                    <Image
                      src={getCategoryImage(cat)}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 1024px) 33vw, 16vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <div
                      className="text-[13px] font-semibold group-hover:text-[var(--brand-gold)] transition-colors truncate"
                      style={{ color: 'var(--brand-text)' }}
                    >
                      {cat.name}
                    </div>
                    {cat.product_count !== undefined && (
                      <div
                        className="text-[11px] mt-0.5 leading-snug"
                        style={{ color: 'var(--brand-text-muted)' }}
                      >
                        {(cat.product_count ?? 0) === 1 ? '1 item' : `${cat.product_count ?? 0} items`}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div
              className="mt-6 pt-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"
              style={{ borderTop: '1px solid var(--brand-border)' }}
            >
              <div className="flex flex-wrap gap-5">
                <Link
                  href="/best-sellers"
                  onClick={() => setShopOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
                  style={{ color: 'var(--brand-terra)' }}
                >
                  <Flame size={14} /> {t('nav.bestsellers')}
                </Link>
                <Link
                  href="/categories?ordering=-created_at"
                  onClick={() => setShopOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  <Sparkles size={14} /> {t('nav.new')}
                </Link>
                <Link
                  href="/categories?category=gifts"
                  onClick={() => setShopOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  <Gift size={14} /> {t('cat.gifts')}
                </Link>
              </div>
              <Link
                href="/categories"
                onClick={() => setShopOpen(false)}
                className="text-[12px] font-medium px-4 py-2 min-h-11 rounded-full transition-all flex items-center"
                style={{
                  background: 'var(--brand-warm)',
                  color: 'var(--brand-brown)',
                }}
              >
                {t('nav.allProducts')} →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Shop by Age Mega Menu ── */}
      <div
        onMouseEnter={openAge}
        onMouseLeave={closeAge}
        className={`hidden lg:block absolute top-full left-0 right-0 z-50 transition-all duration-200 origin-top ${
          ageOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid var(--brand-border)',
          boxShadow: 'var(--shadow-warm-lg)',
        }}
      >
        {ageTouched && (
          <div className="container-shell py-8">
            <div className="flex items-center justify-between mb-5">
              <h3
                className="font-serif text-[1.5rem] font-semibold"
                style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
              >
                {t('nav.shopByAge')}
              </h3>
              <Link
                href="/categories"
                onClick={() => setAgeOpen(false)}
                className="inline-flex items-center gap-1 text-[13px] font-medium hover:gap-2 transition-all"
                style={{ color: 'var(--brand-gold)' }}
              >
                {t('section.viewAll')} <ChevronRight size={14} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {shopByAge.map((age) => (
                <Link
                  key={age.label}
                  href={`/categories?age_group=${age.slug}`}
                  onClick={() => setAgeOpen(false)}
                  className="group flex-shrink-0 flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 hover:shadow-warm-md min-w-[110px]"
                  style={{
                    borderColor: 'var(--brand-border)',
                    background: '#FFFFFF',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full overflow-hidden relative border-2 border-white shadow-warm-sm transition-transform duration-200 group-hover:scale-105"
                    style={{ background: 'var(--brand-warm)' }}
                  >
                    <Image
                      src={age.image}
                      alt={age.label}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <span
                    className="text-[12px] font-medium whitespace-nowrap"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    {age.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
