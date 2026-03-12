import React from 'react'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] py-8 md:py-12 lg:py-16 xl:py-20 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-4xl md:text-6xl">👶</div>
        <div className="absolute top-20 right-20 text-3xl md:text-4xl">🍼</div>
        <div className="absolute bottom-10 left-1/4 text-4xl md:text-5xl">🧸</div>
        <div className="absolute bottom-20 right-1/3 text-3xl md:text-4xl">👶</div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6 leading-tight">
            Nurture with Love — Safe Baby Essentials
          </h1>
          <p className="text-base md:text-xl text-[var(--text-secondary)] mb-6 sm:mb-8">
            Curated, affordable, and safe products for your little one. 
            Shop with confidence using secure M-Pesa payments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8">
            <Link 
              href="/" 
              className="w-full sm:w-auto inline-block px-6 sm:px-8 py-3 sm:py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] text-base sm:text-lg font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg"
            >
              Shop Now
            </Link>
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto inline-block px-6 sm:px-8 py-3 sm:py-4 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-base sm:text-lg font-semibold rounded-full transition-all shadow-md border border-[var(--border)]"
            >
              View Orders
            </Link>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--status-success)]">✓</span>
              <span>Safe & Vetted Products</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--status-success)]">✓</span>
              <span>Secure M-Pesa Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--status-success)]">✓</span>
              <span>Fast Delivery Kenya-wide</span>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8 inline-flex items-center gap-2 bg-[var(--bg-card)]/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
            <span className="text-[var(--status-success)] font-bold">🔒</span>
            <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Trusted by 10,000+ Kenyan Parents
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
