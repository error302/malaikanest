'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '@/lib/products';
import { getBannerUrl } from '@/lib/media';
import { useI18n } from '@/lib/i18n';

interface ResolvedSlide {
  bgImage: string;
  mobileBgImage: string;
  headlineKey?: string;
  subKey?: string;
  ctaKey?: string;
  headline?: string;
  sub?: string;
  cta?: string;
  ctaHref: string;
}

interface HeroProps {
  banners?: Banner[];
}

const FALLBACK_SLIDES: ResolvedSlide[] = [
  {
    headlineKey: 'hero.slide1.title',
    subKey: 'hero.slide1.subtitle',
    ctaKey: 'hero.slide1.cta',
    ctaHref: '/categories?age=newborn',
    bgImage: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1920&q=80&auto=format&fit=crop',
    mobileBgImage: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80&auto=format&fit=crop',
  },
  {
    headlineKey: 'hero.slide2.title',
    subKey: 'hero.slide2.subtitle',
    ctaKey: 'hero.slide2.cta',
    ctaHref: '/categories',
    bgImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1920&q=80&auto=format&fit=crop',
    mobileBgImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80&auto=format&fit=crop',
  },
  {
    headlineKey: 'hero.slide3.title',
    subKey: 'hero.slide3.subtitle',
    ctaKey: 'hero.slide3.cta',
    ctaHref: '/categories',
    bgImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1920&q=80&auto=format&fit=crop',
    mobileBgImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80&auto=format&fit=crop',
  },
];

function normalizeLink(url?: string): string {
  if (!url) return '/categories';
  try {
    const p = new URL(url);
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (site && p.origin === new URL(site).origin) return `${p.pathname}${p.search}`;
    if (/(^|\.)malaikanest\.com$/.test(p.hostname)) return `${p.pathname}${p.search}`;
    return url;
  } catch {
    return url.startsWith('/') ? url : `/${url.replace(/^\/+/, '')}`;
  }
}

function bannersToSlides(banners: Banner[]): ResolvedSlide[] {
  return banners.map((b) => ({
    bgImage: getBannerUrl(b.image_url || b.image) || FALLBACK_SLIDES[0].bgImage,
    mobileBgImage: getBannerUrl(b.mobile_image_url || b.mobile_image || b.image_url || b.image) || FALLBACK_SLIDES[0].mobileBgImage,
    headline: b.title?.trim() || 'Welcome to Malaika Nest',
    sub: b.subtitle?.trim() || 'Safe, affordable, and adorable baby clothing delivered across Kenya.',
    cta: b.button_text?.trim() || 'Shop Now',
    ctaHref: normalizeLink(b.button_link),
  }));
}

export function Hero({ banners = [] }: HeroProps) {
  const { t } = useI18n();
  const slides: ResolvedSlide[] =
    banners.length > 0
      ? bannersToSlides(banners)
      : FALLBACK_SLIDES;

  const [current, setCurrent] = useState(0);
  const [imgErr, setImgErr] = useState<Record<number, boolean>>({});
  const [paused, setPaused] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));

  const go = useCallback((i: number) => {
    setCurrent((i + slides.length) % slides.length);
    setSeen((prev) => {
      const next = new Set(prev);
      next.add((i + slides.length) % slides.length);
      return next;
    });
  }, [slides.length]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => go(current + 1), 7000);
    return () => clearInterval(id);
  }, [current, go, paused]);

  const s = slides[current];
  const headline = s.headline ?? (s.headlineKey ? t(s.headlineKey) : '');
  const sub = s.sub ?? (s.subKey ? t(s.subKey) : '');
  const cta = s.cta ?? (s.ctaKey ? t(s.ctaKey) : '');

  return (
    <section
      className="relative w-full overflow-hidden bg-[#3D2B1F] h-[450px] sm:h-[550px] lg:min-h-[800px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      {/* Background image */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          {slide.bgImage && !imgErr[i] && seen.has(i) && (
            <Image
              src={slide.bgImage}
              alt=""
              aria-hidden
              fill
              priority={i === 0}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1920px"
              onError={() => setImgErr((p) => ({ ...p, [i]: true }))}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
      ))}

      {/* Subtle scrim only at the bottom-left to protect headline text */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'linear-gradient(105deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 35%, rgba(0,0,0,0) 60%)',
        }}
      />

      {/* Bottom soft scrim for mobile legibility */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none sm:hidden"
        aria-hidden
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-end sm:items-center h-[450px] sm:h-[550px] lg:min-h-[800px]">
        <div className="container-shell w-full py-10 sm:py-16">
          <div key={current} className="max-w-xl animate-fade-in-up">
            <span
              className="section-label mb-4 sm:mb-6"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              Malaika Nest
            </span>
            <h1
              className="font-serif font-semibold leading-[1.08] mb-4"
              style={{
                color: '#FFFFFF',
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(2rem, 6.5vw, 4rem)',
                textWrap: 'balance',
              }}
            >
              {headline}
            </h1>
            <p
              className="text-[13px] sm:text-[15px] leading-relaxed mb-8 max-w-lg"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              {sub}
            </p>
            <Link
              href={s.ctaHref}
              className="inline-flex items-center gap-2 rounded-full font-medium text-[13px] sm:text-sm uppercase tracking-[0.12em] px-7 py-3.5 transition-all duration-300 hover:bg-white hover:text-[var(--brand-brown)] hover:border-white"
              style={{
                background: 'transparent',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.7)',
              }}
            >
              {cta}
              <ChevronRight size={15} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>

      {/* Nav arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all hover:bg-white/25 text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label="Next slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all hover:bg-white/25 text-white"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

    </section>
  );
}
