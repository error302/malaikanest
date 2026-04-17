'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, CreditCard, Truck, CheckCircle, Baby } from 'lucide-react';
import { getImageUrl } from '@/lib/media';

interface Slide {
  image: string;
  mobileImage?: string;
  tag: string;
  headline: string;
  sub: string;
  cta: string;
  ctaHref: string;
  ctaSecondary?: string;
  ctaSecondaryHref?: string;
}

interface Banner {
  id: number;
  title?: string;
  subtitle?: string;
  button_text?: string;
  image: string;
  mobile_image?: string;
  button_link?: string;
}

const STATIC_SLIDES: Slide[] = [
  {
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1920&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80',
    tag: 'Premium Baby Care',
    headline: 'Premium Nest for\nLittle Ones',
    sub: 'Handcrafted organic clothing, accessories & toys made with love in Kenya. For ages 0-12 years.',
    cta: 'Shop Newborn',
    ctaHref: '/categories?age=newborn',
    ctaSecondary: 'Shop Everything',
    ctaSecondaryHref: '/categories',
  },
  {
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1920&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    tag: 'Organic Collection',
    headline: 'Organic Cotton\nfor Soft Skin',
    sub: 'Gentle, breathable fabrics made from 100% organic cotton. Perfect for your baby\'s delicate skin.',
    cta: 'Shop Clothing',
    ctaHref: '/categories',
  },
  {
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1920&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80',
    tag: 'Gift Ideas',
    headline: 'The Perfect\nBaby Gift',
    sub: 'Beautifully curated gift sets for baby showers, newborns and special milestones.',
    cta: 'Browse Gifts',
    ctaHref: '/categories',
  },
];

const FALLBACK_GRADIENTS = [
  'from-[#3D2B1F] via-[#5C4033] to-[#3D2B1F]',
  'from-[#1A3A2A] via-[#254D38] to-[#1A3A2A]',
  'from-[#2C1810] via-[#3D2B1F] to-[#2C1810]',
];

const TRUST_BADGES = [
  { Icon: Baby, label: 'Made with love in Kenya' },
  { Icon: Truck, label: 'FREE Shipping on KES 3,000+' },
  { Icon: CheckCircle, label: 'Secure Payments' },
];

const DEFAULT_BANNER_TAG = 'Welcome to Malaika Nest';

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

    if (parsed.hostname === 'malaikanest.duckdns.org' || parsed.hostname === 'www.malaikanest.duckdns.org') {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return url;
  } catch {
    return url.startsWith('/') ? url : `/${url.replace(/^\/+/, '')}`;
  }
}

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [slides, setSlides] = useState<Slide[]>(STATIC_SLIDES);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(media.matches);
    sync();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/banners/`)
      .then(res => res.json())
      .then(data => {
        const apiData = data?.data?.results ?? data?.results ?? [];
        if (mounted && apiData.length > 0) {
          const validBanners = apiData.filter((banner: Banner) => Boolean(banner?.image || banner?.mobile_image));

          if (validBanners.length > 0) {
            const bannerSlides: Slide[] = validBanners.map((banner: Banner) => ({
              image: getImageUrl(banner.image || banner.mobile_image),
              mobileImage: banner.mobile_image ? getImageUrl(banner.mobile_image) : undefined,
              tag: DEFAULT_BANNER_TAG,
              headline: banner.title?.trim() || 'Dress Your Little One with Love',
              sub:
                banner.subtitle?.trim() ||
                'Safe, affordable, and adorable baby clothing delivered across Kenya.',
              cta: banner.button_text?.trim() || 'Shop Now',
              ctaHref: normalizeBannerLink(banner.button_link),
            }));
            setSlides(
              bannerSlides.length > 1
                ? bannerSlides
                : [bannerSlides[0], ...STATIC_SLIDES]
            );
            setCurrent(0);
          }
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (current >= slides.length) {
      setCurrent(0);
    }
  }, [current, slides.length]);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrent((index + slides.length) % slides.length);
        setIsTransitioning(false);
      }, 300);
    },
    [isTransitioning, slides.length]
  );

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);
  const hasMultipleSlides = slides.length > 1;

  useEffect(() => {
    if (!hasMultipleSlides || isPaused) return;
    const timer = setInterval(() => goTo(current + 1), 30000);
    return () => clearInterval(timer);
  }, [current, goTo, hasMultipleSlides, isPaused]);

  const slide = slides[current];

  return (
    <section
      className="relative w-full h-[85vh] min-h-[600px] max-h-[900px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onTouchCancel={() => setIsPaused(false)}
    >
      {/* Background Images */}
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {!imageErrors[i] ? (
            <Image
              src={isMobile && s.mobileImage ? s.mobileImage : s.image}
              alt={s.headline || 'Malaika Nest banner'}
              fill
              priority={i === 0}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="object-cover object-center"
              onError={() => setImageErrors((prev) => ({ ...prev, [i]: true }))}
              sizes="100vw"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length]}`}
            />
          )}
          {/* Soft overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-[1380px] w-full mx-auto px-6 lg:px-16">
          <div
            className={`max-w-2xl transition-all duration-500 ${
              isTransitioning
                ? 'opacity-0 translate-y-4'
                : 'opacity-100 translate-y-0'
            }`}
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs uppercase tracking-[0.12em] px-4 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8D5B5] block" />
              {slide.tag}
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.8rem] font-semibold text-white leading-[1.05] mb-5 whitespace-pre-line tracking-tight">
              {slide.headline}
              <span className="text-[#E8D5B5]"> • 0-12 Years</span>
            </h1>

            {/* Subtext */}
            <p className="text-white/80 text-base sm:text-lg font-light leading-relaxed mb-8 max-w-lg">
              {slide.sub}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 items-center">
              <Link
                href={slide.ctaHref}
                className="inline-flex items-center gap-2 bg-[#8B6914] hover:bg-[#6B5310] text-white font-medium text-sm px-8 py-4 rounded-full transition-colors tracking-wide"
              >
                {slide.cta}
                <ChevronRight size={16} />
              </Link>
              {slide.ctaSecondary && (
                <Link
                  href={slide.ctaSecondaryHref!}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 font-light text-sm px-8 py-4 rounded-full transition-all tracking-wide"
                >
                  {slide.ctaSecondary}
                </Link>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-10 pt-6 border-t border-white/10">
              {TRUST_BADGES.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-white/70 text-xs tracking-wide"
                >
                  <Icon size={14} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {hasMultipleSlides && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {hasMultipleSlides && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-[#E8D5B5]' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Color dots decoration - matching the design */}
      <div className="absolute bottom-8 left-8 z-20 hidden lg:flex gap-2">
        <div className="w-3 h-3 rounded-full bg-[#8B6914]" />
        <div className="w-3 h-3 rounded-full bg-[#C4704A]" />
        <div className="w-3 h-3 rounded-full bg-[#E8D5B5]" />
      </div>
    </section>
  );
}
