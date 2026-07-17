'use client';

import { useState, useCallback, useEffect } from 'react';
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
  content?: Record<string, Record<string, string>>;
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
    if (/malaikanest\.(com|duckdns\.org)$/.test(p.hostname)) return `${p.pathname}${p.search}`;
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

export function Hero({ banners = [], content }: HeroProps) {
  const { t } = useI18n();
  const slides: ResolvedSlide[] =
    banners.length > 0
      ? bannersToSlides(banners)
      : FALLBACK_SLIDES;

  const [current, setCurrent] = useState(0);
  const [imgErr, setImgErr] = useState<Record<number, boolean>>({});
  const [paused, setPaused] = useState(false);

  const go = useCallback((i: number) => setCurrent((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => go(current + 1), 7000);
    return () => clearInterval(id);
  }, [current, go, paused]);

  const s = slides[current];
  const bgOk = s.bgImage && !imgErr[current];
  const headline = s.headline ?? (s.headlineKey ? t(s.headlineKey) : '');
  const sub = s.sub ?? (s.subKey ? t(s.subKey) : '');
  const cta = s.cta ?? (s.ctaKey ? t(s.ctaKey) : '');

  return (
    <section
      className="relative w-full overflow-hidden bg-[#3D2B1F]"
      style={{ minHeight: 'clamp(70vh, 85vh, 800px)' }}
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
          {slide.bgImage && !imgErr[i] && (
            <img
              src={i === current ? (bgOk ? s.mobileBgImage : undefined) : slide.mobileBgImage}
              alt=""
              aria-hidden
              loading={i === 0 ? 'eager' : 'lazy'}
              onError={() => setImgErr((p) => ({ ...p, [i]: true }))}
              className="absolute inset-0 w-full h-full object-cover sm:hidden"
            />
          )}
          {slide.bgImage && !imgErr[i] && (
            <img
              src={slide.bgImage}
              alt=""
              aria-hidden
              loading={i === 0 ? 'eager' : 'lazy'}
              onError={() => setImgErr((p) => ({ ...p, [i]: true }))}
              className="hidden sm:block absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" aria-hidden />

      {/* Content */}
      <div className="relative z-10 flex items-center min-h-[clamp(70vh,85vh,800px)]">
        <div className="container-shell w-full py-12 sm:py-16">
          <div key={current} className="max-w-xl animate-fade-in-up">
            <h1
              className="font-serif font-semibold leading-[1.1] mb-4"
              style={{
                color: '#FFFFFF',
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(1.75rem, 5.5vw, 3.25rem)',
              }}
            >
              {headline}
            </h1>
            <p
              className="text-sm sm:text-base leading-relaxed mb-8 max-w-lg"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              {sub}
            </p>
            <a
              href={s.ctaHref}
              className="inline-flex items-center gap-2 rounded-full font-medium text-sm sm:text-base px-7 py-3.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
            >
              {cta}
              <ChevronRight size={16} />
            </a>
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

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current}
              className="h-2 w-2 min-w-11 min-h-11 rounded-full transition-all duration-300 flex items-center justify-center"
              style={{
                background: i === current ? 'var(--brand-gold)' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
