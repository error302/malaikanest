'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Truck, Shield, Baby } from 'lucide-react';
import type { Banner } from '@/lib/products';
import { getBannerUrl } from '@/lib/media';

interface FallbackSlide {
  tag: string;
  headline: string;
  highlight: string;
  sub: string;
  cta: string;
  ctaHref: string;
  ctaSecondary?: string;
  ctaSecondaryHref?: string;
  gradient: string;
  accent: string;
  bgImage?: string;
  mobileBgImage?: string;
}

const FALLBACK_SLIDES: FallbackSlide[] = [
  {
    tag: 'Premium Baby Care',
    headline: 'A Premium Nest',
    highlight: 'for Little Ones',
    sub: 'Handcrafted organic clothing, accessories & toys made with love in Kenya. For ages 0–12 years.',
    cta: 'Shop Newborn',
    ctaHref: '/categories?age=newborn',
    ctaSecondary: 'Browse Everything',
    ctaSecondaryHref: '/categories',
    gradient: 'linear-gradient(135deg, #3D2B1F 0%, #5C4033 50%, #3D2B1F 100%)',
    accent: '#E8D5B5',
    bgImage:
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1920&q=80&auto=format&fit=crop',
    mobileBgImage:
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80&auto=format&fit=crop',
  },
  {
    tag: 'Organic Collection',
    headline: 'Organic Cotton',
    highlight: 'for Soft Skin',
    sub: 'Gentle, breathable fabrics made from 100% organic cotton. Perfect for your baby\'s delicate skin.',
    cta: 'Shop Clothing',
    ctaHref: '/categories',
    gradient: 'linear-gradient(135deg, #1A3A2A 0%, #2D5A42 50%, #1A3A2A 100%)',
    accent: '#C9A96E',
    bgImage:
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1920&q=80&auto=format&fit=crop',
    mobileBgImage:
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80&auto=format&fit=crop',
  },
  {
    tag: 'Gift Ideas',
    headline: 'The Perfect',
    highlight: 'Baby Gift',
    sub: 'Beautifully curated gift sets for baby showers, newborns and special milestones.',
    cta: 'Browse Gifts',
    ctaHref: '/categories',
    gradient: 'linear-gradient(135deg, #2C1810 0%, #3D2B1F 50%, #2C1810 100%)',
    accent: '#C4704A',
    bgImage:
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1920&q=80&auto=format&fit=crop',
    mobileBgImage:
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80&auto=format&fit=crop',
  },
];

const TRUST_BADGES = [
  { Icon: Baby, label: 'Made with love in Kenya' },
  { Icon: Truck, label: 'FREE Shipping KES 3,000+' },
  { Icon: Shield, label: 'Secure M-Pesa Payments' },
];

interface HeroProps {
  /** Server-fetched banners from /api/v1/products/banners/. Falls back to static slides if empty. */
  banners?: Banner[];
  /** Editable content from the CMS (hero slide text). */
  content?: Record<string, Record<string, string>>;
}

interface ResolvedSlide extends FallbackSlide {
  bgImage: string;
  mobileBgImage: string;
}

function normalizeBannerLink(url?: string): string {
  if (!url) return '/categories';
  try {
    const parsed = new URL(url);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      const site = new URL(siteUrl);
      if (parsed.origin === site.origin) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    }
    if (
      parsed.hostname === 'malaikanest.duckdns.org' ||
      parsed.hostname === 'www.malaikanest.duckdns.org'
    ) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return url;
  } catch {
    return url.startsWith('/') ? url : `/${url.replace(/^\/+/, '')}`;
  }
}

function bannersToSlides(banners: Banner[]): ResolvedSlide[] {
  const accents = ['#E8D5B5', '#C9A96E', '#C4704A'];
  const gradients = [
    'linear-gradient(135deg, #3D2B1F 0%, #5C4033 50%, #3D2B1F 100%)',
    'linear-gradient(135deg, #1A3A2A 0%, #2D5A42 50%, #1A3A2A 100%)',
    'linear-gradient(135deg, #2C1810 0%, #3D2B1F 50%, #2C1810 100%)',
  ];

  return banners.map((b, i) => {
    const bgImage = getBannerUrl(b.image_url || b.image);
    const mobileBgImage = getBannerUrl(
      b.mobile_image_url || b.mobile_image || b.image_url || b.image
    );
    const title = b.title?.trim() || 'Dress Your Little One with Love';
    // Split title into headline + highlight at the first space after the first word
    const firstSpace = title.indexOf(' ');
    const headline = firstSpace > 0 ? title.slice(0, firstSpace) : title;
    const highlight = firstSpace > 0 ? title.slice(firstSpace + 1) : 'with Love';

    return {
      tag: 'Welcome to Malaika Nest',
      headline,
      highlight,
      sub:
        b.subtitle?.trim() ||
        'Safe, affordable, and adorable baby clothing delivered across Kenya.',
      cta: b.button_text?.trim() || 'Shop Now',
      ctaHref: normalizeBannerLink(b.button_link),
      gradient: gradients[i % gradients.length],
      accent: accents[i % accents.length],
      bgImage,
      mobileBgImage,
    };
  });
}

export function Hero({ banners = [], content }: HeroProps) {
  // Merge CMS content overrides into the fallback slides
  const heroContent = content?.hero || {};
  const cmsSlides: FallbackSlide[] = FALLBACK_SLIDES.map((s, i) => {
    const n = i + 1;
    return {
      ...s,
      tag: heroContent[`slide${n}_tag`] || s.tag,
      headline: heroContent[`slide${n}_headline`] || s.headline,
      highlight: heroContent[`slide${n}_highlight`] || s.highlight,
      sub: heroContent[`slide${n}_sub`] || s.sub,
      cta: heroContent[`slide${n}_cta`] || s.cta,
    };
  });

  const apiSlides = banners.length > 0 ? bannersToSlides(banners) : [];

  // Derive slides from banners prop (no state needed — banners come from server).
  // Falls back to CMS-customized static slides when no API banners are provided.
  const slides: ResolvedSlide[] = apiSlides.length > 0 ? apiSlides : (cmsSlides as ResolvedSlide[]);

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const goTo = useCallback(
    (i: number) => setCurrent((i + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(() => goTo(current + 1), 6000);
    return () => clearInterval(t);
  }, [current, goTo, isPaused]);

  const slide = slides[current];

  return (
    <section
      id="home"
      className="relative w-full overflow-hidden"
      style={{ minHeight: 'min(85vh, 760px)' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      {/* Background layers */}
      {slides.map((s, i) => {
        const hasError = imageErrors[i];
        const bg = hasError ? undefined : s.bgImage;
        const mobileBg = hasError ? undefined : s.mobileBgImage;
        return (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              background: s.gradient,
              opacity: i === current ? 1 : 0,
            }}
            aria-hidden={i !== current}
          >
            {bg && (
              <img
                src={mobileBg || bg}
                alt=""
                aria-hidden
                loading={i === 0 ? 'eager' : 'lazy'}
                onError={() => setImageErrors((prev) => ({ ...prev, [i]: true }))}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: i === current ? 0.55 : 0 }}
              />
            )}
          </div>
        );
      })}

      {/* Decorative blurred orbs */}
      <div
        className="absolute top-1/4 -right-32 w-[28rem] h-[28rem] rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: slide.accent }}
        aria-hidden
      />
      <div
        className="absolute bottom-0 -left-32 w-[24rem] h-[24rem] rounded-full opacity-15 blur-3xl"
        style={{ background: slide.accent }}
        aria-hidden
      />

      {/* Soft overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(105deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15) 100%)',
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.35) 0%, transparent 50%)',
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center min-h-[min(85vh,760px)]">
        <div className="container-shell w-full">
          <div key={current} className="max-w-2xl animate-fade-in-up">
            {/* Tag */}
            <div
              className="inline-flex items-center gap-2 backdrop-blur-sm border rounded-full mb-5 sm:mb-6 px-4 py-1.5"
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full block"
                style={{ background: slide.accent }}
                aria-hidden
              />
              <span
                className="text-[10px] sm:text-xs uppercase tracking-[0.16em] font-medium"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                {slide.tag}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-serif font-semibold leading-[1.05] mb-4 sm:mb-5"
              style={{
                color: '#FFFFFF',
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(2.25rem, 7vw, 3.8rem)',
                letterSpacing: '-0.02em',
              }}
            >
              {slide.headline}
              <br />
              <span style={{ color: slide.accent }}>{slide.highlight}</span>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}> · 0–12 yrs</span>
            </h1>

            {/* Subtext */}
            <p
              className="text-sm sm:text-base lg:text-lg font-light leading-[1.7] mb-7 sm:mb-8 max-w-lg"
              style={{ color: 'rgba(255,255,255,0.82)' }}
            >
              {slide.sub}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 items-center">
              <a
                href={slide.ctaHref}
                className="inline-flex items-center gap-2 rounded-full font-medium text-sm sm:text-base px-7 sm:px-8 py-3.5 sm:py-4 transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-0.5"
                style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
              >
                {slide.cta}
                <ChevronRight size={16} />
              </a>
              {slide.ctaSecondary && (
                <a
                  href={slide.ctaSecondaryHref!}
                  className="inline-flex items-center gap-2 backdrop-blur-sm border rounded-full font-light text-sm sm:text-base px-7 sm:px-8 py-3.5 sm:py-4 transition-all duration-300 hover:bg-white/20"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#FFFFFF',
                  }}
                >
                  {slide.ctaSecondary}
                </a>
              )}
            </div>

            {/* Trust badges */}
            <div
              className="flex flex-wrap gap-x-5 sm:gap-x-6 gap-y-3 mt-9 sm:mt-10 pt-5 sm:pt-6"
              style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
            >
              {TRUST_BADGES.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-[11px] sm:text-xs tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  <Icon size={14} strokeWidth={1.75} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all hover:bg-white/25"
            style={{
              background: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#FFFFFF',
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            aria-label="Next slide"
            className="absolute right-3 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all hover:bg-white/25"
            style={{
              background: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#FFFFFF',
            }}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === current ? 32 : 8,
                background: i === current ? slide.accent : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}

      {/* Color dot decoration */}
      <div className="absolute bottom-6 sm:bottom-8 left-6 lg:left-8 z-20 hidden sm:flex gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--brand-gold)' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--brand-terra)' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
      </div>
    </section>
  );
}
