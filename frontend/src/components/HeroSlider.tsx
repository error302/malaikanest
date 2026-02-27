"use client"
import React from 'react'

const slides = [
  { 
    id: 1, 
    title: 'Gentle baby care', 
    subtitle: 'Premium products for your little one', 
    image: 'https://images.unsplash.com/photo-1542000551297-9f6c3d7c7c42?w=1200&q=80&auto=format&fit=crop',
    cta: 'Shop Now',
    link: '/'
  },
  { 
    id: 2, 
    title: 'Comfort & Safety', 
    subtitle: 'Soft fabrics, safe designs', 
    image: 'https://images.unsplash.com/photo-1529068755536-a5ade09f5d4c?w=1200&q=80&auto=format&fit=crop',
    cta: 'Explore',
    link: '/categories'
  },
  { 
    id: 3, 
    title: 'Essentials on sale', 
    subtitle: 'Great prices for Nairobi families', 
    image: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=1200&q=80&auto=format&fit=crop',
    cta: 'View Deals',
    link: '/'
  }
]

export default function HeroSlider() {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-none">
      <div className="relative h-64 md:h-80 lg:h-96">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <div className="w-full h-full relative">
              <img 
                src={slide.image} 
                alt={slide.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
            </div>
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
                <div className={`max-w-xl transition-all duration-500 ${
                  i === index ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                    {slide.title}
                  </h2>
                  <p className="text-lg md:text-xl text-white/90 mb-4">
                    {slide.subtitle}
                  </p>
                  <a
                    href={slide.link}
                    className="inline-block px-6 py-3 bg-cta hover:bg-cta-hover text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg"
                  >
                    {slide.cta}
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === index 
                ? 'bg-white w-8' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Arrow Navigation */}
      <button
        onClick={() => setIndex((index - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors z-10"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => setIndex((index + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors z-10"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
