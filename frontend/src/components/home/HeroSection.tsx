'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, CreditCard, Truck, CheckCircle } from 'lucide-react';
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
    tag: 'New Season Arrivals',
    headline: 'Everything your\nlittle one needs.',
    sub: 'Premium baby essentials, carefully chosen for Kenyan families. Safe, affordable, delivered.',
    cta: 'Shop Collection',
    ctaHref: '/categories',
    ctaSecondary: 'Best Sellers',
    ctaSecondaryHref: '/best-sellers',
  },
  {
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1920&q=80',
    tag: 'Safe & Tested',
    headline: 'Clothing made\nfor soft skin.',
    sub: 'Organic cotton onesies, rompers and sets — gentle on newborns, kind to parents budgets.',
    cta: 'Shop Clothing',
    ctaHref: '/categories',
  },
  {
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1920&q=80',
    tag: 'Gift Ideas',
    headline: 'The perfect gift\nfor every baby.',
    sub: 'Beautifully curated gift sets for baby showers, newborns and milestones.',
    cta: 'Browse Gift Sets',
    ctaHref: '/categories',
  },
];

const FALLBACK_GRADIENTS = [
  'from-[#1A3A2A] via-[#254D38] to-[#1A3A2A]',
  'from-[#3D2B1F] via-[#5C3D2E] to-[#3D2B1F]',
  'from-[#1C2E4A] via-[#253D5E] to-[#1C2E4A]',
];

const TRUST_BADGES = [
  { Icon: CreditCard, label: 'Secure M-Pesa' },
  { Icon: Truck, label: 'Fast Delivery' },
  { Icon: CheckCircle, label: 'Parent Approved' },
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
    if (!hasMultipleSlides) return;
    const timer = setInterval(() => goTo(current + 1), 6000);
    return () => clearInterval(timer);
  }, [current, goTo, hasMultipleSlides]);

  const slide = slides[current];

  return (
    <section className="relative w-full h-[88vh] min-h-[560px] max-h-[900px] overflow-hidden bg-[#1A3A2A]">
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
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      ))}

      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-[1380px] w-full mx-auto px-6 lg:px-16">
          <div
            className={`max-w-xl transition-all duration-500 ${
              isTransitioning
                ? 'opacity-0 translate-y-4'
                : 'opacity-100 translate-y-0'
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs uppercase tracking-[0.12em] px-4 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8C98A] block" />
              {slide.tag}
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.6rem] font-semibold text-white leading-[1.08] mb-5 whitespace-pre-line tracking-tight">
              {slide.headline}
            </h1>

            <p className="text-white/75 text-base sm:text-lg font-light leading-relaxed mb-8 max-w-md">
              {slide.sub}
            </p>

            <div className="flex flex-wrap gap-3 items-center">
              <Link
                href={slide.ctaHref}
                className="inline-flex items-center gap-2 bg-[#C4704A] hover:bg-[#D4835E] text-white font-medium text-sm px-7 py-3.5 rounded-full transition-colors tracking-wide"
              >
                {slide.cta}
                <ChevronRight size={16} />
              </Link>
              {slide.ctaSecondary && (
                <Link
                  href={slide.ctaSecondaryHref!}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 font-light text-sm px-7 py-3.5 rounded-full transition-all tracking-wide"
                >
                  {slide.ctaSecondary}
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-8 pt-6 border-t border-white/10">
              {TRUST_BADGES.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-white/60 text-xs tracking-wide"
                >
                  <Icon size={14} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hasMultipleSlides && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {hasMultipleSlides && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-[#E8C98A]' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
