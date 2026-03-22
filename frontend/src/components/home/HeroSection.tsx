'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, CreditCard, Truck, CheckCircle } from 'lucide-react';
import { getImageUrl } from '@/lib/media';

interface Slide {
  image: string;
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
  image: string;
  button_link?: string;
}

const STATIC_SLIDES: Slide[] = [
  {
    image: '/images/hero/hero-1.jpg',
    tag: 'New Season Arrivals',
    headline: 'Everything your\nlittle one needs.',
    sub: 'Premium baby essentials, carefully chosen for Kenyan families. Safe, affordable, delivered.',
    cta: 'Shop Collection',
    ctaHref: '/categories',
    ctaSecondary: 'Best Sellers',
    ctaSecondaryHref: '/best-sellers',
  },
  {
    image: '/images/hero/hero-2.jpg',
    tag: 'Safe & Tested',
    headline: 'Clothing made\nfor soft skin.',
    sub: 'Organic cotton onesies, rompers and sets — gentle on newborns, kind to parents budgets.',
    cta: 'Shop Clothing',
    ctaHref: '/categories',
  },
  {
    image: '/images/hero/hero-3.jpg',
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

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [banners, setBanners] = useState<Banner[]>([]);
  const [slides, setSlides] = useState<Slide[]>(STATIC_SLIDES);

  useEffect(() => {
    let mounted = true;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/banners/`)
      .then(res => res.json())
      .then(data => {
        const apiData = data?.data?.results ?? data?.results ?? [];
        if (mounted && apiData.length > 0) {
          setBanners(apiData);
          const bannerSlides: Slide[] = apiData.map((b: Banner) => ({
            image: getImageUrl(b.image),
            tag: b.title || 'Special Offer',
            headline: b.subtitle || '',
            sub: '',
            cta: 'Shop Now',
            ctaHref: b.button_link || '/categories',
          }));
          setSlides([...STATIC_SLIDES, ...bannerSlides]);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

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

  useEffect(() => {
    const timer = setInterval(() => goTo(current + 1), 6000);
    return () => clearInterval(timer);
  }, [current, goTo]);

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
              src={s.image}
              alt={s.headline}
              fill
              priority={i === 0}
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

      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-[#E8C98A]' : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
