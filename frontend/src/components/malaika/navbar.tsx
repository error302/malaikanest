'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Heart,
  Heart as HeartIcon,
  User,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  Package,
  Baby,
  Settings,
  LogOut,
} from 'lucide-react';
import { Logo } from './logo';
import { LanguageToggle } from './language-toggle';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { showToast } from '@/lib/toast';
import { useCategories } from '@/lib/categoriesContext';
import { useCartDrawer } from '@/lib/cartDrawerStore';
import type { Branding } from '@/lib/settings';
import { NavSearchModal } from './nav-search-modal';
import { NavMobileDrawer } from './nav-mobile-drawer';
import { NavMegaMenus } from './nav-mega-menus';

const FALLBACK_COLORS = [
  '#FCE7E1', '#FEF3DC', '#E1EEF8', '#EFE3F8', '#E1F4E8', '#FCE1EE'
];

const NAV_LINKS = [
  { nameKey: 'nav.home', href: '/' },
  { nameKey: 'nav.shop', href: '/categories', hasDropdown: true },
  { nameKey: 'nav.thrifted', href: '/thrifted' },
  { nameKey: 'nav.bestsellers', href: '/best-sellers' },
  { nameKey: 'nav.contact', href: '/contact' },
];

const SHOP_BY_AGE = [
  { label: 'Newborn', slug: 'baby', image: '/images/ages/newborn.jpg' },
  { label: '0-3 Months', slug: 'baby', image: '/images/ages/0-3m.jpg' },
  { label: '3-6 Months', slug: 'baby', image: '/images/ages/3-6m.jpg' },
  { label: '6-12 Months', slug: 'baby', image: '/images/ages/6-9m.jpg' },
  { label: '1-2 Years', slug: 'toddler', image: '/images/ages/1-2y.jpg' },
  { label: '2-4 Years', slug: 'toddler', image: '/images/ages/2-4y.jpg' },
  { label: '4-6 Years', slug: 'kids', image: '/images/ages/4-6y.jpg' },
  { label: '6-9 Years', slug: 'kids', image: '/images/ages/6-9y.jpg' },
  { label: '9-12 Years', slug: 'kids', image: '/images/ages/9-12y.jpg' },
];

const SEARCH_SUGGESTIONS = ['Onesies', 'Feeding Set', 'Stroller', 'Baby Monitor', 'Gift Set'];

export function Navbar({ cartCount = 0, wishlistCount = 0, branding }: { cartCount?: number; wishlistCount?: number; branding?: Branding }) {
  const router = useRouter();
  const { t } = useI18n();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { categories } = useCategories();
  const openCartDrawer = useCartDrawer((s) => s.openDrawer);
  const [shopOpen, setShopOpen] = useState(false);
  const [ageOpen, setAgeOpen] = useState(false);
  // Mega-menu panels mount their content only after first open so their
  // category/tile images never download on pages where the menus are untouched.
  const [shopTouched, setShopTouched] = useState(false);
  const [ageTouched, setAgeTouched] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const shopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close mobile menu, search overlay, account dropdown on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileOpen) setMobileOpen(false);
        if (searchOpen) setSearchOpen(false);
        if (accountMenuOpen) setAccountMenuOpen(false);
        if (shopOpen) setShopOpen(false);
        if (ageOpen) setAgeOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, searchOpen, accountMenuOpen, shopOpen, ageOpen]);

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
    setShopTouched(true);
    setShopOpen(true);
    setAgeOpen(false);
  };
  const closeShop = () => {
    shopTimer.current = setTimeout(() => setShopOpen(false), 120);
  };
  const openAge = () => {
    if (shopTimer.current) clearTimeout(shopTimer.current);
    setAgeTouched(true);
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
          className="container-shell flex items-center justify-between h-[64px] sm:h-[72px] gap-2 sm:gap-4"
          aria-label="Main navigation"
        >
          {/* Left & Center section */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 xl:gap-6 min-w-0 flex-1">
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
              className="flex-shrink-0 mr-1 lg:mr-2 select-none"
              aria-label="Malaika Nest home"
            >
              <Logo logoUrl={branding?.logo_url} storeName={branding?.store_name} tagline={branding?.tagline} />
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-2.5 xl:gap-4.5 flex-shrink-0">
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
                      onClick={() => (shopOpen ? closeShop() : openShop())}
                      onFocus={openShop}
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
                  onClick={() => (ageOpen ? closeAge() : openAge())}
                  onFocus={openAge}
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
            <div className="hidden xl:flex items-center min-w-[140px] max-w-[220px] 2xl:max-w-[260px] flex-1">
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
          </div>

          {/* Right Action Icons — Fixed non-shifting anchor */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 ml-2">
            {/* Search trigger icon for medium screens / tablet */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex xl:hidden w-9 h-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)] flex-shrink-0"
              style={{ color: 'var(--brand-brown)' }}
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.75} />
            </button>

            {/* Language toggle */}
            <LanguageToggle className="flex-shrink-0" />

            <Link
              href="/wishlist"
              className="relative flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)] flex-shrink-0"
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
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-[var(--brand-warm)]"
                >
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
                    style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
                  >
                    {userInitial}
                  </span>
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
                        <Package size={16} style={{ color: 'var(--brand-gold)' }} />
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
              onClick={(e) => {
                // Open the slide-over cart drawer instead of navigating away.
                // The drawer's "View full cart" link still navigates to /cart
                // for users who want the detailed page.
                e.preventDefault();
                openCartDrawer();
              }}
              className="relative hidden lg:flex w-10 h-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
              style={{ color: 'var(--brand-brown)' }}
              aria-label={`${t('nav.cart')}${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            >
              <ShoppingCart size={19} strokeWidth={1.75} />
              {cartCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full text-[10px] font-semibold text-white px-1"
                  style={{ background: 'var(--brand-gold)' }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        <NavMegaMenus
          shopOpen={shopOpen}
          shopTouched={shopTouched}
          openShop={openShop}
          closeShop={closeShop}
          setShopOpen={setShopOpen}
          ageOpen={ageOpen}
          ageTouched={ageTouched}
          openAge={openAge}
          closeAge={closeAge}
          setAgeOpen={setAgeOpen}
          categories={categories}
          fallbackColors={FALLBACK_COLORS}
          shopByAge={SHOP_BY_AGE}
        />
      </header>

      <NavSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        suggestions={SEARCH_SUGGESTIONS}
        onSubmit={(q) => {
          setSearchOpen(false);
          router.push(`/categories?search=${encodeURIComponent(q)}`);
        }}
      />

      <NavMobileDrawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        branding={branding}
        navLinks={NAV_LINKS}
        shopByAge={SHOP_BY_AGE}
        categories={categories}
        fallbackColors={FALLBACK_COLORS}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        user={user}
        userInitial={userInitial}
        onLogout={handleLogout}
        wishlistCount={wishlistCount}
        cartCount={cartCount}
      />
    </>
  );
}
