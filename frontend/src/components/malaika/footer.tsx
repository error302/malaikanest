'use client';

import Link from 'next/link';
import {
  Facebook,
  Instagram,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  Lock,
} from 'lucide-react';
import { Logo } from './logo';
import { useI18n } from '@/lib/i18n';
import type { Branding } from '@/lib/settings';
import { TiktokLogo } from '@phosphor-icons/react';
import { FooterTrustPillars } from './footer-trust-pillars';
import { FooterNewsletter } from './footer-newsletter';
import { FooterBottomBar } from './footer-bottom-bar';

interface FooterProps {
  branding?: Branding;
}

function TikTok({ size = 18 }: { size?: number }) {
  return <TiktokLogo size={size} weight="fill" />;
}

// ── Social Channels ──────────────────────────────────────────────────────────
const SOCIAL = (b?: Branding) => [
  { label: 'Instagram', href: b?.instagram_url || 'https://www.instagram.com/malaikanest/', Icon: Instagram },
  { label: 'WhatsApp', href: b?.whatsapp_url || 'https://wa.me/254726771321', Icon: MessageCircle },
  { label: 'TikTok', href: b?.tiktok_url || 'https://www.tiktok.com/@malaikanest', Icon: TikTok },
  { label: 'Facebook', href: b?.facebook_url || 'https://web.facebook.com/profile.php?id=61592150003761', Icon: Facebook },
];

export function Footer({ branding }: FooterProps) {
  const b = branding;
  const { t } = useI18n();

  return (
    <footer
      id="contact"
      className="border-t transition-colors"
      style={{
        background: '#FAF7F2',
        borderColor: 'var(--brand-border)',
      }}
      role="contentinfo"
    >
      <FooterTrustPillars />
      <FooterNewsletter />

      {/* ── Main Navigation Columns ─────────────────────────────────────────── */}
      <div className="container-shell py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b" style={{ borderColor: 'var(--brand-border)' }}>
          {/* Brand Column (4 cols on large) */}
          <div className="col-span-2 md:col-span-4 lg:col-span-4">
            <Logo logoUrl={b?.logo_url} storeName={b?.store_name} tagline={b?.tagline} />
            <p
              className="mt-3.5 text-xs sm:text-sm leading-relaxed max-w-sm"
              style={{ color: 'var(--brand-text-secondary)' }}
            >
              {b?.footer_tagline ||
                'Thoughtfully designed baby & children’s clothing for Kenya. Organic comfort, gentle fabrics, and newborn essentials delivered with maternal warmth.'}
            </p>

            {/* M-Pesa Official Till Callout */}
            <div
              className="mt-5 inline-flex items-center gap-3.5 rounded-2xl p-3 border shadow-xs"
              style={{
                background: '#FFFFFF',
                borderColor: 'var(--brand-border)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(139, 105, 20, 0.1)' }}
              >
                <CreditCard size={18} style={{ color: 'var(--brand-gold)' }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--brand-text-muted)' }}>
                  Lipa Na M-Pesa
                </p>
                <p className="text-sm font-bold tracking-tight" style={{ color: 'var(--brand-text)' }}>
                  Buy Goods Till: 3370347
                </p>
              </div>
            </div>

            {/* Social channels */}
            <div className="flex gap-2.5 mt-5">
              {SOCIAL(b).map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border flex items-center justify-center transition-all hover:scale-105 hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
                  style={{
                    background: '#FFFFFF',
                    borderColor: 'var(--brand-border)',
                    color: 'var(--brand-brown)',
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Column (3 cols on large) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <h3
              className="text-[11px] uppercase tracking-[0.14em] font-bold mb-4"
              style={{ color: 'var(--brand-text)' }}
            >
              Shop Collections
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'All Products', href: '/categories' },
                { label: 'Baby (0–24 Months)', href: '/categories?age_group=baby' },
                { label: 'Toddler (2–5 Years)', href: '/categories?age_group=toddler' },
                { label: 'Kids (6–12 Years)', href: '/categories?age_group=kids' },
                { label: 'Pre-Loved Mitumba', href: '/thrifted' },
                { label: 'Best Sellers', href: '/best-sellers' },
                { label: 'New Arrivals', href: '/categories?sort=newest' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-xs sm:text-[13px] transition-colors hover:text-[var(--brand-gold)] block py-0.5 leading-snug"
                    style={{ color: 'var(--brand-text-secondary)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care Column (2 cols on large) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3
              className="text-[11px] uppercase tracking-[0.14em] font-bold mb-4"
              style={{ color: 'var(--brand-text)' }}
            >
              Customer Care
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Track Your Order', href: '/track' },
                { label: 'My Saved Wishlist', href: '/wishlist' },
                { label: 'Shipping & Delivery', href: '/shipping' },
                { label: '72-Hour Return Policy', href: '/returns' },
                { label: 'Frequently Asked Questions', href: '/faq' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'Visit Mombasa Workshop', href: '/find-us' },
                { label: 'About Our Story', href: '/about' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-xs sm:text-[13px] transition-colors hover:text-[var(--brand-gold)] block py-0.5 leading-snug"
                    style={{ color: 'var(--brand-text-secondary)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Support & Shop Location (3 cols on large) */}
          <div className="col-span-2 md:col-span-4 lg:col-span-3">
            <h3
              className="text-[11px] uppercase tracking-[0.14em] font-bold mb-4"
              style={{ color: 'var(--brand-text)' }}
            >
              Direct Help &amp; Location
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`https://wa.me/254726771321`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-[13px] inline-flex items-center gap-2.5 transition-colors hover:text-[var(--brand-gold)] font-medium"
                  style={{ color: 'var(--brand-text)' }}
                >
                  <MessageCircle size={15} style={{ color: 'var(--brand-green-light)' }} />
                  <span>WhatsApp: +254 726 771 321</span>
                </a>
                <p className="text-[11px] ml-6 mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>
                  Fastest replies · Mon–Sat 8:30am–6:30pm
                </p>
              </li>
              <li>
                <a
                  href={`tel:${b?.contact_phone || '+254726771321'}`}
                  className="text-xs sm:text-[13px] inline-flex items-center gap-2.5 transition-colors hover:text-[var(--brand-gold)]"
                  style={{ color: 'var(--brand-text-secondary)' }}
                >
                  <Phone size={15} style={{ color: 'var(--brand-gold)' }} />
                  <span>{b?.contact_phone || '+254 726 771 321'}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${b?.contact_email || 'hello@malaikanest.com'}`}
                  className="text-xs sm:text-[13px] inline-flex items-center gap-2.5 transition-colors hover:text-[var(--brand-gold)]"
                  style={{ color: 'var(--brand-text-secondary)' }}
                >
                  <Mail size={15} style={{ color: 'var(--brand-gold)' }} />
                  <span>{b?.contact_email || 'hello@malaikanest.com'}</span>
                </a>
              </li>
              <li className="pt-1">
                <Link
                  href="/find-us"
                  className="text-xs sm:text-[13px] inline-flex items-start gap-2.5 transition-colors hover:text-[var(--brand-gold)]"
                  style={{ color: 'var(--brand-text-secondary)' }}
                >
                  <MapPin size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-gold)' }} />
                  <span>
                    <strong>Tawakal Toto Shop</strong>, Mombasa, Kenya
                    <span className="block text-[11px] mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>
                      In-person shopping &amp; pickup available
                    </span>
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Verified Payment & Trust Strip (Carter's-style security badges) ──── */}
        <div className="py-6 flex flex-wrap items-center justify-between gap-4 border-b" style={{ borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--brand-text-secondary)' }}>
            <Lock size={14} style={{ color: 'var(--brand-gold)' }} />
            <span>Guaranteed Safe &amp; Secure Checkout</span>
          </div>

          <FooterBottomBar />
        </div>
      </div>
    </footer>
  );
}
