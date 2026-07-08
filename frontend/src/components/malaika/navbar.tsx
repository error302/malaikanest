'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Heart,
  User,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Shirt,
  Package,
  Home,
  Gamepad2,
  Car,
  Gift,
  Sparkles,
  Flame,
  Baby,
} from 'lucide-react';
import { Logo } from './logo';
import { AnnouncementBar } from './announcement-bar';

const NAV_LINKS = [
  { name: 'Home', href: '#home' },
  { name: 'Shop', href: '#shop', hasDropdown: true },
  { name: 'Newborn', href: '#newborn' },
  { name: 'Best Sellers', href: '#best-sellers' },
  { name: 'About', href: '#about' },
];

const SHOP_BY_AGE = [
  'Newborn', '0-3 Months', '3-6 Months', '6-9 Months',
  '1-2 Years', '2-4 Years', '4-6 Years', '6-9 Years', '9-12 Years',
];

const SHOP_CATEGORIES = [
  { name: 'Clothing', desc: 'Onesies, rompers & more', Icon: Shirt, color: '#FCE7E1' },
  { name: 'Baby Essentials', desc: 'Feeding, bathing & care', Icon: Package, color: '#FEF3DC' },
  { name: 'Nursery', desc: 'Furniture, bedding & decor', Icon: Home, color: '#E1EEF8' },
  { name: 'Toys & Learning', desc: 'Play, explore & grow', Icon: Gamepad2, color: '#EFE3F8' },
  { name: 'Travel & Safety', desc: 'Strollers, carriers & safety', Icon: Car, color: '#E1F4E8' },
  { name: 'Gift Sets', desc: 'Curated bundles', Icon: Gift, color: '#FCE1EE' },
];

const SEARCH_SUGGESTIONS = ['Onesies', 'Feeding Set', 'Stroller', 'Baby Monitor', 'Gift Set'];

export function Navbar({ cartCount = 0, wishlistCount = 0 }: { cartCount?: number; wishlistCount?: number }) {
  const [shopOpen, setShopOpen] = useState(false);
  const [ageOpen, setAgeOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const shopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen, searchOpen]);

  const openShop = () => {
    if (shopTimer.current) clearTimeout(shopTimer.current);
    setShopOpen(true);
    setAgeOpen(false);
  };
  const closeShop = () => {
    shopTimer.current = setTimeout(() => setShopOpen(false), 120);
  };
  const openAge = () => {
    if (shopTimer.current) clearTimeout(shopTimer.current);
    setAgeOpen(true);
    setShopOpen(false);
  };
  const closeAge = () => {
    shopTimer.current = setTimeout(() => setAgeOpen(false), 120);
  };

  return (
    <>
      <AnnouncementBar />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'shadow-warm-md backdrop-blur-md'
            : 'border-b'
        }`}
        style={{
          background: scrolled ? 'rgba(253, 248, 243, 0.96)' : 'var(--brand-cream)',
          borderColor: 'var(--brand-border)',
        }}
        role="banner"
      >
        <nav
          className="container-shell flex items-center h-[64px] sm:h-[72px] gap-4 sm:gap-6 lg:gap-8"
          aria-label="Main navigation"
        >
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
            style={{ color: 'var(--brand-brown)' }}
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>

          {/* Logo */}
          <Link
            href="#home"
            className="flex-shrink-0"
            aria-label="Malaika Nest home"
          >
            <Logo />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-7 flex-1">
            {NAV_LINKS.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.name}
                  onMouseEnter={openShop}
                  onMouseLeave={closeShop}
                  className="relative"
                >
                  <button
                    className="inline-flex items-center gap-1 text-[14px] font-medium transition-colors"
                    style={{ color: 'var(--brand-brown)' }}
                    aria-expanded={shopOpen}
                    aria-haspopup="true"
                  >
                    {link.name}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-[14px] font-medium transition-colors hover:text-[var(--brand-gold)]"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  {link.name}
                </a>
              )
            )}

            {/* Shop by Age dropdown */}
            <div
              onMouseEnter={openAge}
              onMouseLeave={closeAge}
              className="relative"
            >
              <button
                className="inline-flex items-center gap-1 text-[14px] font-medium transition-colors"
                style={{ color: 'var(--brand-brown)' }}
                aria-expanded={ageOpen}
                aria-haspopup="true"
              >
                Shop by Age
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${ageOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Desktop search */}
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-md ml-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  document
                    .getElementById('shop')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="relative w-full"
              role="search"
            >
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--brand-text-muted)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search baby essentials…"
                className="input-warm w-full"
                aria-label="Search products"
              />
            </form>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1 sm:gap-1.5 ml-auto md:ml-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
              style={{ color: 'var(--brand-brown)' }}
              aria-label="Search"
            >
              <Search size={20} strokeWidth={1.75} />
            </button>

            <Link
              href="#wishlist"
              className="relative hidden sm:flex w-11 h-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
              style={{ color: 'var(--brand-brown)' }}
              aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ''}`}
            >
              <Heart size={19} strokeWidth={1.75} />
              {wishlistCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full text-[10px] font-semibold text-white px-1"
                  style={{ background: 'var(--brand-terra)' }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="#account"
              className="hidden md:flex w-11 h-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
              style={{ color: 'var(--brand-brown)' }}
              aria-label="Account"
            >
              <User size={19} strokeWidth={1.75} />
            </Link>

            <Link
              href="#cart"
              className="relative inline-flex items-center gap-2 h-10 sm:h-11 px-3 sm:px-4 rounded-full transition-all duration-300 hover:shadow-warm-md"
              style={{
                background: 'var(--brand-gold)',
                color: '#FFFFFF',
              }}
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            >
              <ShoppingCart size={16} strokeWidth={2} />
              <span className="hidden sm:inline text-[13px] font-medium">Cart</span>
              <span
                className="inline-flex min-w-[20px] h-5 items-center justify-center rounded-full text-[10px] font-semibold px-1"
                style={{
                  background: '#FFFFFF',
                  color: 'var(--brand-gold)',
                }}
              >
                {cartCount}
              </span>
            </Link>
          </div>
        </nav>

        {/* ── Shop Mega Menu ── */}
        <div
          onMouseEnter={openShop}
          onMouseLeave={closeShop}
          className={`absolute top-full left-0 right-0 transition-all duration-200 origin-top ${
            shopOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
          style={{
            background: '#FFFFFF',
            borderTop: '1px solid var(--brand-border)',
            boxShadow: 'var(--shadow-warm-lg)',
          }}
        >
          <div className="container-shell py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {SHOP_CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href="#shop"
                  onClick={() => setShopOpen(false)}
                  className="group flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden hover:shadow-warm-md"
                  style={{
                    borderColor: 'var(--brand-border)',
                    background: '#FFFFFF',
                  }}
                >
                  <div
                    className="h-24 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{ background: cat.color }}
                  >
                    <cat.Icon
                      size={36}
                      strokeWidth={1.5}
                      style={{ color: 'var(--brand-gold)' }}
                    />
                  </div>
                  <div className="p-3">
                    <div
                      className="text-[13px] font-semibold group-hover:text-[var(--brand-gold)] transition-colors"
                      style={{ color: 'var(--brand-text)' }}
                    >
                      {cat.name}
                    </div>
                    <div
                      className="text-[11px] mt-0.5 leading-snug"
                      style={{ color: 'var(--brand-text-muted)' }}
                    >
                      {cat.desc}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div
              className="mt-6 pt-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"
              style={{ borderTop: '1px solid var(--brand-border)' }}
            >
              <div className="flex flex-wrap gap-5">
                <Link
                  href="#best-sellers"
                  onClick={() => setShopOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
                  style={{ color: 'var(--brand-terra)' }}
                >
                  <Flame size={14} /> Best Sellers
                </Link>
                <Link
                  href="#new-arrivals"
                  onClick={() => setShopOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  <Sparkles size={14} /> New Arrivals
                </Link>
                <Link
                  href="#gifts"
                  onClick={() => setShopOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  <Gift size={14} /> Gift Ideas
                </Link>
              </div>
              <Link
                href="#shop"
                onClick={() => setShopOpen(false)}
                className="text-[12px] font-medium px-4 py-2 rounded-full transition-all"
                style={{
                  background: 'var(--brand-warm)',
                  color: 'var(--brand-text)',
                }}
              >
                View All Products →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Shop by Age Mega Menu ── */}
        <div
          onMouseEnter={openAge}
          onMouseLeave={closeAge}
          className={`absolute top-full left-0 right-0 transition-all duration-200 origin-top ${
            ageOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
          style={{
            background: '#FFFFFF',
            borderTop: '1px solid var(--brand-border)',
            boxShadow: 'var(--shadow-warm-lg)',
          }}
        >
          <div className="container-shell py-8">
            <div className="flex items-center justify-between mb-5">
              <h3
                className="font-serif text-[1.5rem] font-semibold"
                style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
              >
                Shop by Age
              </h3>
              <Link
                href="#shop"
                onClick={() => setAgeOpen(false)}
                className="inline-flex items-center gap-1 text-[13px] font-medium hover:gap-2 transition-all"
                style={{ color: 'var(--brand-gold)' }}
              >
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {SHOP_BY_AGE.map((age) => (
                <Link
                  key={age}
                  href="#shop"
                  onClick={() => setAgeOpen(false)}
                  className="group flex-shrink-0 flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 hover:shadow-warm-md min-w-[110px]"
                  style={{
                    borderColor: 'var(--brand-border)',
                    background: '#FFFFFF',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: 'var(--brand-warm)' }}
                  >
                    <Baby
                      size={26}
                      strokeWidth={1.5}
                      style={{ color: 'var(--brand-gold)' }}
                    />
                  </div>
                  <span
                    className="text-[12px] font-medium whitespace-nowrap"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    {age}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Search Overlay ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-20 sm:pt-24 px-4 animate-fade-in-up"
          style={{ background: 'rgba(44, 24, 16, 0.5)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-warm-xl w-full max-w-2xl p-5 sm:p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
              style={{ color: 'var(--brand-text-muted)' }}
              aria-label="Close search"
            >
              <X size={20} />
            </button>
            <p
              className="text-[11px] uppercase tracking-[0.14em] mb-3 font-semibold"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              Search products
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setSearchOpen(false);
                  document
                    .getElementById('shop')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. baby onesie, feeding bottle…"
                className="flex-1 rounded-xl px-4 py-3 text-sm transition-colors"
                style={{
                  border: '1px solid var(--brand-border)',
                  color: 'var(--brand-text)',
                  background: 'var(--brand-bg-alt)',
                }}
                aria-label="Search query"
              />
              <button
                type="submit"
                className="rounded-xl px-6 py-3 text-sm font-medium transition-colors"
                style={{
                  background: 'var(--brand-gold)',
                  color: '#FFFFFF',
                }}
              >
                Search
              </button>
            </form>
            <div className="mt-4 flex gap-2 flex-wrap">
              {SEARCH_SUGGESTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSearchQuery(t);
                    setSearchOpen(false);
                    document
                      .getElementById('shop')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    background: 'var(--brand-warm)',
                    color: 'var(--brand-brown)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[200] lg:hidden overflow-y-auto"
          style={{ background: 'var(--brand-cream)' }}
        >
          <div
            className="flex items-center justify-between h-16 px-5"
            style={{ borderBottom: '1px solid var(--brand-border)' }}
          >
            <Logo />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="w-11 h-11 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
              style={{ color: 'var(--brand-brown)' }}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          <div className="px-5 py-6 space-y-6">
            <nav className="space-y-1" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-lg font-medium border-b"
                  style={{
                    color: 'var(--brand-text)',
                    borderColor: 'var(--brand-border)',
                    fontFamily: 'var(--font-cormorant)',
                  }}
                >
                  {link.name}
                </a>
              ))}
            </nav>

            <div>
              <p
                className="text-[11px] uppercase tracking-[0.14em] mb-3 font-semibold"
                style={{ color: 'var(--brand-text-muted)' }}
              >
                Shop by Age
              </p>
              <div className="flex flex-wrap gap-2">
                {SHOP_BY_AGE.slice(0, 6).map((age) => (
                  <a
                    key={age}
                    href="#shop"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2 rounded-full border text-[13px] transition-all"
                    style={{
                      borderColor: 'var(--brand-border)',
                      color: 'var(--brand-brown)',
                    }}
                  >
                    {age}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p
                className="text-[11px] uppercase tracking-[0.14em] mb-3 font-semibold"
                style={{ color: 'var(--brand-text-muted)' }}
              >
                Shop Categories
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SHOP_CATEGORIES.map((cat) => (
                  <a
                    key={cat.name}
                    href="#shop"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 p-3 rounded-xl transition-colors"
                    style={{ background: 'var(--brand-warm)' }}
                  >
                    <cat.Icon
                      size={22}
                      strokeWidth={1.5}
                      style={{ color: 'var(--brand-gold)' }}
                    />
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: 'var(--brand-text)' }}
                    >
                      {cat.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div
              className="pt-5 space-y-3"
              style={{ borderTop: '1px solid var(--brand-border)' }}
            >
              <a
                href="#account"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 text-sm py-2"
                style={{ color: 'var(--brand-brown)' }}
              >
                <User size={18} /> Account / Login
              </a>
              <a
                href="#wishlist"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 text-sm py-2"
                style={{ color: 'var(--brand-brown)' }}
              >
                <Heart size={18} /> Wishlist ({wishlistCount})
              </a>
              <a
                href="#cart"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 text-sm py-2"
                style={{ color: 'var(--brand-brown)' }}
              >
                <ShoppingCart size={18} /> Cart ({cartCount})
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
