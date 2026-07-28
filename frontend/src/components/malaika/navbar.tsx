'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ChevronUp,
  Settings,
  LogOut,
  UserCheck,
  Heart as HeartIcon,
} from 'lucide-react';
import { Logo } from './logo';
import { LanguageToggle } from './language-toggle';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { showToast } from '@/lib/toast';
import { useCategories } from '@/lib/categoriesContext';
import Image from 'next/image';
import type { Branding } from '@/lib/settings';

const FALLBACK_COLORS = [
  '#FCE7E1', '#FEF3DC', '#E1EEF8', '#EFE3F8', '#E1F4E8', '#FCE1EE'
];

const NAV_LINKS = [
  { nameKey: 'nav.home', href: '/' },
  { nameKey: 'nav.shop', href: '/categories', hasDropdown: true },
  { nameKey: 'nav.thrifted', href: '/thrifted' },
  { nameKey: 'nav.bestsellers', href: '/best-sellers' },
  { nameKey: 'nav.contact', href: '/find-us' },
];

const SHOP_BY_AGE = [
  { label: 'Newborn', slug: 'baby' },
  { label: '0-3 Months', slug: 'baby' },
  { label: '3-6 Months', slug: 'baby' },
  { label: '6-12 Months', slug: 'baby' },
  { label: '1-2 Years', slug: 'toddler' },
  { label: '2-4 Years', slug: 'toddler' },
  { label: '4-6 Years', slug: 'kids' },
  { label: '6-9 Years', slug: 'kids' },
  { label: '9-12 Years', slug: 'kids' },
];

const SEARCH_SUGGESTIONS = ['Onesies', 'Feeding Set', 'Stroller', 'Baby Monitor', 'Gift Set'];

export function Navbar({ cartCount = 0, wishlistCount = 0, branding }: { cartCount?: number; wishlistCount?: number; branding?: Branding }) {
  const router = useRouter();
  const { t } = useI18n();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { categories } = useCategories();
  const [shopOpen, setShopOpen] = useState(false);
  const [ageOpen, setAgeOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const shopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    if (accountMenuOpen) {
      document.addEventListener('click', onClickOutside);
      return () => document.removeEventListener('click', onClickOutside);
    }
  }, [accountMenuOpen]);

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    try {
      await logout();
      showToast('Signed out', 'success');
      router.push('/');
    } catch {
      // Even if API logout fails, local state is cleared already
      router.push('/');
    }
  };

  const userInitial =
    (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
  const userDisplayName = user?.name || user?.email?.split('@')[0] || '';

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
          className="container-shell flex items-center h-[64px] sm:h-[72px] gap-1.5 sm:gap-3 lg:gap-5 overflow-hidden"
          aria-label="Main navigation"
        >
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-10 h-10 min-w-10 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)] flex-shrink-0"
            style={{ color: 'var(--brand-brown)' }}
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 mr-2 lg:mr-4 select-none"
            aria-label="Malaika Nest home"
          >
            <Logo logoUrl={branding?.logo_url} storeName={branding?.store_name} tagline={branding?.tagline} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-5 flex-shrink-0">
            {NAV_LINKS.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.nameKey}
                  onMouseEnter={openShop}
                  onMouseLeave={closeShop}
                  className="relative"
                >
                  <button
                    className="inline-flex items-center gap-1 text-xs xl:text-[13px] font-medium whitespace-nowrap transition-colors"
                    style={{ color: 'var(--brand-brown)' }}
                    aria-expanded={shopOpen}
                    aria-haspopup="true"
                  >
                    {t(link.nameKey)}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              ) : (
                <Link
                  key={link.nameKey}
                  href={link.href}
                  className="text-xs xl:text-[13px] font-medium whitespace-nowrap transition-colors hover:text-[var(--brand-gold)]"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  {t(link.nameKey)}
                </Link>
              )
            )}

            {/* Shop by Age dropdown */}
            <div
              onMouseEnter={openAge}
              onMouseLeave={closeAge}
              className="relative"
            >
              <button
                className="inline-flex items-center gap-1 text-xs xl:text-[13px] font-medium whitespace-nowrap transition-colors"
                style={{ color: 'var(--brand-brown)' }}
                aria-expanded={ageOpen}
                aria-haspopup="true"
              >
                {t('nav.shopByAge')}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${ageOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Desktop search */}
          <div className="hidden xl:flex items-center flex-shrink-0 w-[160px] xl:w-[220px] 2xl:w-[260px]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/categories?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="relative w-full"
              role="search"
            >
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--brand-text-muted)' }}
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.search') + '…'}
                className="input-warm w-full text-xs py-2 pl-9 pr-3"
                aria-label={t('nav.search')}
              />
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
            {/* Search trigger icon for medium screens / tablet */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="xl:hidden flex w-9 h-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)] flex-shrink-0"
              style={{ color: 'var(--brand-brown)' }}
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.75} />
            </button>

            {/* Language toggle */}
            <LanguageToggle className="flex-shrink-0" />

            <Link
              href="/wishlist"
              className="relative hidden lg:flex w-10 h-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
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

            {isAuthenticated ? (
              <div ref={accountMenuRef} className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  aria-label={`Account menu for ${userDisplayName}`}
                  className="flex items-center gap-2 pl-1 pr-3 h-11 rounded-full transition-colors hover:bg-[var(--brand-warm)]"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
                    style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
                  >
                    {userInitial}
                  </span>
                  <span className="hidden lg:inline text-[13px] font-medium max-w-[100px] xl:max-w-[150px] truncate">
                    {userDisplayName}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-150 ${accountMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {accountMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl border shadow-warm-lg overflow-hidden z-50"
                    style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
                  >
                    <div className="p-4 border-b" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-bg-alt)' }}>
                      <p className="text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--brand-text-muted)' }}>
                        Signed in as
                      </p>
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--brand-text)' }}>
                        {user?.name || 'Welcome back'}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>
                        {user?.email}
                      </p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/account"
                        onClick={() => setAccountMenuOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--brand-warm)]"
                        style={{ color: 'var(--brand-text)' }}
                      >
                        <User size={16} style={{ color: 'var(--brand-gold)' }} />
                        My Account
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setAccountMenuOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--brand-warm)]"
                        style={{ color: 'var(--brand-text)' }}
                      >
                        <Package2 size={16} style={{ color: 'var(--brand-gold)' }} />
                        My Orders
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setAccountMenuOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--brand-warm)]"
                        style={{ color: 'var(--brand-text)' }}
                      >
                        <HeartIcon size={16} style={{ color: 'var(--brand-gold)' }} />
                        My Wishlist
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setAccountMenuOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--brand-warm)]"
                          style={{ color: 'var(--brand-text)' }}
                        >
                          <Settings size={16} style={{ color: 'var(--brand-gold)' }} />
                          Admin Dashboard
                        </Link>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      role="menuitem"
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors border-t"
                      style={{
                        borderColor: 'var(--brand-border)',
                        background: 'var(--brand-bg-alt)',
                        color: 'var(--brand-terra)',
                      }}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden lg:flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-medium transition-all hover:shadow-warm-md border"
                style={{
                  borderColor: 'var(--brand-border)',
                  color: 'var(--brand-brown)',
                  background: '#FFFFFF',
                }}
              >
                <User size={16} strokeWidth={1.75} />
                {t('nav.signin')}
              </Link>
            )}

            <Link
              href="/cart"
              className="relative hidden lg:inline-flex items-center gap-1.5 h-9 sm:h-11 px-2.5 sm:px-4 rounded-full transition-all duration-300 hover:shadow-warm-md"
              style={{
                background: 'var(--brand-gold)',
                color: '#FFFFFF',
              }}
               aria-label={`${t('nav.cart')}${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            >
              <ShoppingCart size={16} strokeWidth={2} />
              <span className="hidden sm:inline text-[13px] font-medium">{t('nav.cart')}</span>
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
          className={`hidden lg:block absolute top-full left-0 right-0 transition-all duration-200 origin-top ${
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
              {categories.slice(0, 6).map((cat, idx) => (
                <Link
                  key={cat.id}
                  href={cat.slug ? `/categories?category=${cat.slug}` : '/categories'}
                  onClick={() => setShopOpen(false)}
                  className="group flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden hover:shadow-warm-md"
                  style={{
                    borderColor: 'var(--brand-border)',
                    background: '#FFFFFF',
                  }}
                >
                  <div
                    className="h-24 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 relative"
                    style={{ background: cat.image ? undefined : FALLBACK_COLORS[idx % FALLBACK_COLORS.length] }}
                  >
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 1024px) 33vw, 16vw"
                        className="object-cover"
                      />
                    ) : (
                      <Package
                        size={36}
                        strokeWidth={1.5}
                        style={{ color: 'var(--brand-gold)' }}
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <div
                      className="text-[13px] font-semibold group-hover:text-[var(--brand-gold)] transition-colors truncate"
                      style={{ color: 'var(--brand-text)' }}
                    >
                      {cat.name}
                    </div>
                    {cat.product_count !== undefined && (
                      <div
                        className="text-[11px] mt-0.5 leading-snug"
                        style={{ color: 'var(--brand-text-muted)' }}
                      >
                        {cat.product_count} items
                      </div>
                    )}
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
                  href="/best-sellers"
                  onClick={() => setShopOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
                  style={{ color: 'var(--brand-terra)' }}
                >
                  <Flame size={14} /> {t('nav.bestsellers')}
                </Link>
                <Link
                  href="/categories?ordering=-created_at"
                  onClick={() => setShopOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  <Sparkles size={14} /> {t('nav.new')}
                </Link>
                <Link
                  href="/categories?category=gifts"
                  onClick={() => setShopOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  <Gift size={14} /> {t('cat.gifts')}
                </Link>
              </div>
              <Link
                href="/categories"
                onClick={() => setShopOpen(false)}
                className="text-[12px] font-medium px-4 py-2 min-h-11 rounded-full transition-all flex items-center"
                style={{
                  background: 'var(--brand-warm)',
                  color: 'var(--brand-text)',
                }}
              >
                {t('nav.allProducts')} →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Shop by Age Mega Menu ── */}
        <div
          onMouseEnter={openAge}
          onMouseLeave={closeAge}
          className={`hidden lg:block absolute top-full left-0 right-0 transition-all duration-200 origin-top ${
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
                {t('nav.shopByAge')}
              </h3>
              <Link
                href="/categories"
                onClick={() => setAgeOpen(false)}
                className="inline-flex items-center gap-1 text-[13px] font-medium hover:gap-2 transition-all"
                style={{ color: 'var(--brand-gold)' }}
              >
                {t('section.viewAll')} <ChevronRight size={14} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {SHOP_BY_AGE.map((age) => (
                <Link
                  key={age.label}
                  href={`/categories?age_group=${age.slug}`}
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
                    {age.label}
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
              {t('nav.searchOverlayLabel')}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setSearchOpen(false);
                  router.push(`/categories?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="flex flex-col sm:flex-row gap-3"
              role="search"
            >
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="flex-1 rounded-xl px-4 py-3 text-sm transition-colors"
                style={{
                  border: '1px solid var(--brand-border)',
                  color: 'var(--brand-text)',
                  background: 'var(--brand-bg-alt)',
                }}
                aria-label={t('nav.search')}
              />
              <button
                type="submit"
                className="rounded-xl px-6 py-3 text-sm font-medium transition-colors"
                style={{
                  background: 'var(--brand-gold)',
                  color: '#FFFFFF',
                }}
              >
                {t('nav.searchAction')}
              </button>
            </form>
            <div className="mt-4 flex gap-2 flex-wrap">
              {SEARCH_SUGGESTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push(`/categories?search=${encodeURIComponent(t)}`);
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
      {mobileOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] lg:hidden overflow-y-auto"
            style={{ background: 'var(--brand-cream)' }}
          >
            <div
              className="flex items-center justify-between h-16 px-5"
              style={{ borderBottom: '1px solid var(--brand-border)' }}
            >
              <Logo logoUrl={branding?.logo_url} storeName={branding?.store_name} tagline={branding?.tagline} />
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
                  <Link
                    key={link.nameKey}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 text-lg font-medium border-b"
                    style={{
                      color: 'var(--brand-text)',
                      borderColor: 'var(--brand-border)',
                      fontFamily: 'var(--font-cormorant)',
                    }}
                  >
                    {t(link.nameKey)}
                  </Link>
                ))}
              </nav>

              <div>
                <p
                  className="text-[11px] uppercase tracking-[0.14em] mb-3 font-semibold"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  {t('nav.shopByAge')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SHOP_BY_AGE.slice(0, 6).map((age) => (
                    <Link
                      key={age.label}
                      href={`/categories?age_group=${age.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-2 rounded-full border text-[13px] transition-all"
                      style={{
                        borderColor: 'var(--brand-border)',
                        color: 'var(--brand-brown)',
                      }}
                    >
                      {age.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p
                  className="text-[11px] uppercase tracking-[0.14em] mb-3 font-semibold"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  {t('nav.categories')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {categories.slice(0, 6).map((cat, idx) => (
                    <Link
                      key={cat.id}
                      href={cat.slug ? `/categories?category=${cat.slug}` : '/categories'}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 p-3 rounded-xl transition-colors border"
                      style={{ 
                        background: '#FFFFFF',
                        borderColor: 'var(--brand-border)'
                      }}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                        style={{ background: cat.image ? undefined : FALLBACK_COLORS[idx % FALLBACK_COLORS.length] }}
                      >
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <Package
                            size={20}
                            strokeWidth={1.5}
                            style={{ color: 'var(--brand-gold)' }}
                          />
                        )}
                      </div>
                      <span
                        className="text-[13px] font-medium truncate"
                        style={{ color: 'var(--brand-text)' }}
                      >
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div
                className="pt-5 space-y-3"
                style={{ borderTop: '1px solid var(--brand-border)' }}
              >
                {isAuthenticated && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-2xl mb-2"
                    style={{ background: 'var(--brand-bg-alt)' }}
                  >
                    <span
                      className="w-11 h-11 rounded-full flex items-center justify-center font-semibold flex-shrink-0"
                      style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
                    >
                      {userInitial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--brand-text)' }}>
                        {user?.name || 'Welcome back'}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>
                        {user?.email}
                      </p>
                    </div>
                  </div>
                )}
                <Link
                  href={isAuthenticated ? '/account' : '/login'}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-sm py-2"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  <User size={18} /> {isAuthenticated ? 'My Account' : `Account / ${t('nav.signin')}`}
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      href="/account/orders"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 text-sm py-2"
                      style={{ color: 'var(--brand-brown)' }}
                    >
                      <Package size={18} /> My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 text-sm py-2"
                        style={{ color: 'var(--brand-brown)' }}
                      >
                        <Settings size={18} /> Admin Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 text-sm py-2 w-full text-left"
                      style={{ color: 'var(--brand-terra)' }}
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </>
                )}
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-sm py-2"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  <Heart size={18} /> {t('nav.wishlist')} ({wishlistCount})
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-sm py-2"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  <ShoppingCart size={18} /> {t('nav.cart')} ({cartCount})
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
