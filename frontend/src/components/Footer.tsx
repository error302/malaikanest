"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Facebook, Instagram, MessageCircle } from 'lucide-react'

import Logo from './Logo'

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
)

export default function Footer() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null

  return (
    <footer className="border-t border-default bg-surface pt-16">
      <div className="container-shell grid gap-10 pb-12 md:grid-cols-2 xl:grid-cols-4">
        <section>
          <Logo />
          <p className="mt-5 max-w-xs text-[18px] text-[var(--text-secondary)]">Premium baby products for Kenyan families.</p>
          <div className="mt-6 flex items-center gap-4 text-[var(--text-primary)]">
            <a href="https://www.facebook.com/groups/1614565823184535/?ref=share&mibextid=NSMWBT" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-default transition-colors hover:bg-[var(--bg-soft)]">
              <Facebook size={18} />
            </a>
            <a href="https://www.instagram.com/rashidmaimuna?igsh=MWkwdnJndWw1a2E0MA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-default transition-colors hover:bg-[var(--bg-soft)]">
              <Instagram size={18} />
            </a>
            <a href="https://www.tiktok.com/@tawakaltotowear?_r=1&_t=ZS-94UPJxYR7uy" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-default transition-colors hover:bg-[var(--bg-soft)]">
              <TikTokIcon className="text-current" />
            </a>
            <a href="https://wa.me/254726771321" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-default transition-colors hover:bg-[var(--bg-soft)]">
              <MessageCircle size={18} />
            </a>
          </div>
        </section>

        <section>
          <h3 className="font-body text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)]">Shop</h3>
          <ul className="mt-6 space-y-3 text-[18px] text-[var(--text-secondary)]">
            <li><Link href="/categories" className="transition-colors hover:text-[var(--text-primary)]">All Products</Link></li>
            <li><Link href="/categories?group=Newborn" className="transition-colors hover:text-[var(--text-primary)]">Newborn</Link></li>
            <li><Link href="/categories?group=Feeding" className="transition-colors hover:text-[var(--text-primary)]">Feeding</Link></li>
            <li><Link href="/categories?group=Toys" className="transition-colors hover:text-[var(--text-primary)]">Toys</Link></li>
            <li><Link href="/categories?group=Bundles" className="transition-colors hover:text-[var(--text-primary)]">Bundles</Link></li>
          </ul>
        </section>

        <section>
          <h3 className="font-body text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)]">Support</h3>
          <ul className="mt-6 space-y-3 text-[18px] text-[var(--text-secondary)]">
            <li><Link href="/faq" className="transition-colors hover:text-[var(--text-primary)]">FAQ</Link></li>
            <li><Link href="/shipping" className="transition-colors hover:text-[var(--text-primary)]">Shipping Info</Link></li>
            <li><Link href="/contact" className="transition-colors hover:text-[var(--text-primary)]">Contact Us</Link></li>
            <li><Link href="/about" className="transition-colors hover:text-[var(--text-primary)]">About Us</Link></li>
            <li><Link href="/contact" className="transition-colors hover:text-[var(--text-primary)]">Order Support</Link></li>
          </ul>
        </section>

        <section>
          <h3 className="font-body text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)]">Contact</h3>
          <ul className="mt-6 space-y-3 text-[18px] text-[var(--text-secondary)]">
            <li>support@malaikanest7@gmail.com</li>
            <li>+254 726 771 321</li>
            <li>Mombasa, Kenya</li>
            <li>M-Pesa Till: 3370347</li>
          </ul>
        </section>
      </div>

      <div className="border-t border-default bg-[var(--bg-primary)] py-6">
        <div className="container-shell flex flex-col items-center justify-between gap-2 text-sm text-[var(--text-secondary)] sm:flex-row">
          <p>© 2026 Malaika Nest. All rights reserved.</p>
          <p>Made with ❤️ in Mombasa, Kenya</p>
        </div>
      </div>
    </footer>
  )
}

