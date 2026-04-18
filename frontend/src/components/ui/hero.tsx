"use client"
import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

interface Slide {
  image: string
  tag: string
  headline: string
  sub: string
  cta: string
  ctaHref: string
}

const SLIDES: Slide[] = [
  {
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1920&q=80",
    tag: "New Season Arrivals",
    headline: "Everything your\nlittle one needs.",
    sub: "Premium baby essentials, carefully chosen for Kenyan families. Safe, affordable, delivered.",
    cta: "Shop Collection",
    ctaHref: "/categories",
  },
  {
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1920&q=80",
    tag: "Safe & Tested",
    headline: "Clothing made\nfor soft skin.",
    sub: "Organic cotton onesies, rompers and sets — gentle on newborns, kind to parents budgets.",
    cta: "Shop Clothing",
    ctaHref: "/categories",
  },
  {
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1920&q=80",
    tag: "Gift Ideas",
    headline: "The perfect gift\nfor every baby.",
    sub: "Beautifully curated gift sets for baby showers, newborns and milestones.",
    cta: "Browse Gift Sets",
    ctaHref: "/categories",
  },
]

const FALLBACK_GRADIENTS = [
  "from-[#1A3A2A] via-[#254D38] to-[#1A3A2A]",
  "from-[#3D2B1F] via-[#5C3D2E] to-[#3D2B1F]",
  "from-[#1C2E4A] via-[#253D5E] to-[#1C2E4A]",
]

export default function AnimatedHero() {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrent((index + SLIDES.length) % SLIDES.length)
      setIsTransitioning(false)
    }, 500)
  }, [isTransitioning])

  const prev = () => goTo(current - 1)
  const next = () => goTo(current + 1)

  useEffect(() => {
    const timer = setInterval(() => goTo(current + 1), 6000)
    return () => clearInterval(timer)
  }, [current, goTo])

  const slide = SLIDES[current]

  return (
    <section className="relative w-full h-[88vh] min-h-[560px] max-h-[900px] overflow-hidden bg-[#1A3A2A]">
      {/* Background Slides */}
      {SLIDES.map((s, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={false}
          animate={{
            opacity: i === current ? 1 : 0,
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
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
        </motion.div>
      ))}

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 2 === 0 ? "#E8C98A" : "#C4704A",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, -200],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-[1380px] w-full mx-auto px-6 lg:px-16">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-xl"
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs uppercase tracking-[0.12em] px-4 py-1.5 rounded-full mb-5"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8C98A] block" />
              {slide.tag}
            </motion.div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.6rem] font-semibold text-white leading-[1.08] mb-5 whitespace-pre-line tracking-tight">
              {slide.headline}
            </h1>

            <p className="text-white/75 text-base sm:text-lg font-light leading-relaxed mb-8 max-w-md">
              {slide.sub}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href={slide.ctaHref}
                className="inline-flex items-center justify-center bg-[#E8C98A] hover:bg-[#d4b87a] text-[#1A3A2A] px-8 py-3.5 rounded-full text-sm font-medium transition-all hover:scale-105"
              >
                {slide.cta}
              </Link>
              <Link
                href="/best-sellers"
                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white px-8 py-3.5 rounded-full text-sm font-medium transition-all hover:scale-105"
              >
                Best Sellers
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={next}
        className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-[#E8C98A]" : "w-2 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
