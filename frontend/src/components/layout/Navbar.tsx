'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Heart, 
  ChevronDown, 
  X, 
  Menu, 
  Shirt, 
  Package, 
  Home, 
  Gamepad2, 
  Car, 
  Gift, 
  Sparkles, 
  Flame,
  Baby,
  ChevronRight,
  MapPin,
  ShoppingCart
} from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/authContext';
import { useWishlist } from '@/lib/wishlistContext';

const SHOP_BY_AGE = [
  { name: 'Newborn', href: '/categories?age=newborn', image: '/images/age-newborn.jpg' },
  { name: '0-3 Months', href: '/categories?age=0-3', image: '/images/age-0-3.jpg' },
  { name: '3-6 Months', href: '/categories?age=3-6', image: '/images/age-3-6.jpg' },
  { name: '6-9 Months', href: '/categories?age=6-9', image: '/images/age-6-9.jpg' },
  { name: '1-12 Years', href: '/categories?age=1-12', image: '/images/age-1-12.jpg' },
  { name: '2-4 Years', href: '/categories?age=2-4', image: '/images/age-2-4.jpg' },
  { name: '4-6 Years', href: '/categories?age=4-6', image: '/images/age-4-6.jpg' },
  { name: '6-9 Years', href: '/categories?age=6-9', image: '/images/age-6-9.jpg' },
  { name: '9-12 Years', href: '/categories?age=9-12', image: '/images/age-9-12.jpg' },
];

const SHOP_CATEGORIES = [
  {
    name: 'Clothing',
    href: '/categories',
    description: 'Onesies, rompers & more',
    Icon: Shirt,
    color: 'bg-rose-50',
    featured: ['Newborn Sets', 'Toddler Tops', 'Sleepwear'],
  },
  {
    name: 'Baby Essentials',
    href: '/categories',
    description: 'Feeding, bathing & care',
    Icon: Package,
    color: 'bg-amber-50',
    featured: ['Feeding', 'Bath Time', 'Diapering'],
  },
  {
    name: 'Nursery',
    href: '/categories',
    description: 'Furniture, bedding & decor',
    Icon: Home,
    color: 'bg-sky-50',
    featured: ['Bedding', 'Furniture', 'Lighting'],
  },
  {
    name: 'Toys & Learning',
    href: '/categories',
    description: 'Play, explore & grow',
    Icon: Gamepad2,
    color: 'bg-violet-50',
    featured: ['0-12 Months', 'Toddler Toys', 'Educational'],
  },
  {
    name: 'Travel & Safety',
    href: '/categories',
    description: 'Strollers, carriers & safety',
    Icon: Car,
    color: 'bg-green-50',
    featured: ['Strollers', 'Car Seats', 'Baby Carriers'],
  },
  {
    name: 'Gift Sets',
    href: '/categories',
    description: 'Curated bundles for every occasion',
    Icon: Gift,
    color: 'bg-pink-50',
    featured: ['Newborn Gifts', 'Baby Shower', 'Milestone Gifts'],
  },
];

const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Clothes', href: '/categories', hasDropdown: true },
  { name: 'Newborn', href: '/categories?age=newborn' },
  { name: 'Best Sellers', href: '/best-sellers' },
];

export default function Navbar() {
  const [shopOpen, setShopOpen] = useState(false);
  const [ageMenuOpen, setAgeMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const shopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { items } = useCart();
  const itemCount = items.length;
  const { count: wishlistCount } = useWishlist();
  const { user } = useAuth();

  // Close mobile menu on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openShop = () => {
    if (shopTimeoutRef.current) clearTimeout(shopTimeoutRef.current);
    setShopOpen(true);
    setAgeMenuOpen(false);
  };

  const closeShop = () => {
    shopTimeoutRef.current = setTimeout(() => setShopOpen(false), 120);
  };

  const openAgeMenu = () => {
    if (shopTimeoutRef.current) clearTimeout(shopTimeoutRef.current);
    setAgeMenuOpen(true);
    setShopOpen(false);
  };

  const closeAgeMenu = () => {
    shopTimeoutRef.current = setTimeout(() => setAgeMenuOpen(false), 120);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/categories?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-[#8B6914] text-white text-center text-xs py-2.5 px-4 font-light tracking-wide">
        Free delivery on orders over <strong className="font-semibold">KES 3,000</strong>
        &nbsp;·&nbsp; M-Pesa Till: <strong className="font-semibold">3370347</strong>
        &nbsp;·&nbsp; Same-day delivery in Mombasa
      </div>

      {/* Main nav */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/98 backdrop-blur-md shadow-warm-sm border-b border-[#E8E0D5]'
            : 'bg-[#FDF8F3] border-b border-[#E8E0D5]/50'
        }`}
      >
        <div className="max-w-[1380px] mx-auto px-6 lg:px-10 flex items-center h-[72px] gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="relative w-10 h-10">
              <Image
                src="/images/logo.png"
                alt="Malaika Nest"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="font-serif text-xl font-semibold text-[#2C1810] tracking-tight">
                Malaika Nest
              </div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-[#8A7060] font-light">
                Baby & Maternity
              </div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-8 flex-1">
            {NAV_LINKS.map((link) => (
              <div key={link.name} className="relative">
                {link.hasDropdown ? (
                  <div
                    onMouseEnter={openShop}
                    onMouseLeave={closeShop}
                  >
                    <button
                      className="flex items-center gap-1 text-sm text-[#5C4033] hover:text-[#8B6914] transition-colors font-medium"
                      aria-expanded={shopOpen}
                    >
                      {link.name}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className="text-sm text-[#5C4033] hover:text-[#8B6914] transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                )}
              </div>
            ))}

            {/* Shop by Age dropdown */}
            <div
              onMouseEnter={openAgeMenu}
              onMouseLeave={closeAgeMenu}
              className="relative"
            >
              <button
                className="flex items-center gap-1 text-sm text-[#5C4033] hover:text-[#8B6914] transition-colors font-medium"
                aria-expanded={ageMenuOpen}
              >
                Shop by Age
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${ageMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="AI Search"
                className="w-full bg-[#F5EFE6] border border-[#E8E0D5] rounded-full px-4 py-2 pl-10 text-sm text-[#2C1810] placeholder:text-[#8A7060] focus:outline-none focus:border-[#8B6914] transition-colors"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7060]" />
            </form>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search mobile */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F5EFE6] transition-colors text-[#5C4033]"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative hidden sm:flex w-10 h-10 items-center justify-center rounded-full hover:bg-[#F5EFE6] transition-colors text-[#5C4033]"
              aria-label="Wishlist"
            >
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#C4704A] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link
              href={user ? "/account" : "/login"}
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#5C4033]"
              aria-label="Account"
            >
              <User size={18} />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 h-10 px-4 rounded-full border border-[#8B6914] bg-[#8B6914] text-white text-sm font-medium hover:bg-[#6B5310] transition-all"
              aria-label="Cart"
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Cart</span>
              <span className="w-5 h-5 bg-white text-[#8B6914] rounded-full text-[10px] flex items-center justify-center font-semibold">
                {itemCount}
              </span>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F5EFE6] transition-colors text-[#5C4033]"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* ── SHOP BY AGE MEGA MENU ── */}
        <div
          onMouseEnter={openAgeMenu}
          onMouseLeave={closeAgeMenu}
          className={`absolute top-full left-0 right-0 bg-white border-t border-[#E8E0D5] shadow-warm-lg transition-all duration-200 origin-top ${
            ageMenuOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <div className="max-w-[1380px] mx-auto px-10 py-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl font-semibold text-[#2C1810]">Shop by Age</h3>
              <Link 
                href="/categories" 
                className="flex items-center gap-1 text-sm text-[#8B6914] font-medium hover:gap-2 transition-all"
              >
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {SHOP_BY_AGE.map((age) => (
                <Link
                  key={age.name}
                  href={age.href}
                  onClick={() => setAgeMenuOpen(false)}
                  className="group flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-2xl border border-[#E8E0D5] hover:border-[#8B6914] hover:shadow-warm-md transition-all duration-200 bg-white min-w-[120px]"
                >
                  <div className="w-16 h-16 rounded-full bg-[#F5EFE6] flex items-center justify-center group-hover:bg-[#8B6914]/10 transition-colors">
                    <Baby className="w-7 h-7 text-[#8B6914]" />
                  </div>
                  <span className="text-sm font-medium text-[#2C1810] whitespace-nowrap">{age.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── CATEGORIES MEGA MENU ── */}
        <div
          onMouseEnter={openShop}
          onMouseLeave={closeShop}
          className={`absolute top-full left-0 right-0 bg-white border-t border-[#E8E0D5] shadow-warm-lg transition-all duration-200 origin-top ${
            shopOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <div className="max-w-[1380px] mx-auto px-10 py-8">
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
              {SHOP_CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  onClick={() => setShopOpen(false)}
                  className="group flex flex-col rounded-2xl border border-[#E8E0D5] hover:border-[#8B6914]/40 hover:shadow-warm-md transition-all duration-200 overflow-hidden bg-white"
                >
                  <div
                    className={`${cat.color} h-28 flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}
                  >
                    <cat.Icon className="w-10 h-10 text-[#8B6914]" />
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold text-[#2C1810] group-hover:text-[#8B6914] transition-colors">
                      {cat.name}
                    </div>
                    <div className="text-[11px] text-[#8A7060] mt-0.5 leading-snug">
                      {cat.description}
                    </div>
                    <ul className="mt-2 space-y-0.5">
                      {cat.featured.map((item) => (
                        <li
                          key={item}
                          className="text-[11px] text-[#5C4033] hover:text-[#8B6914] transition-colors leading-relaxed"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom strip */}
            <div className="mt-6 pt-5 border-t border-[#E8E0D5] flex items-center justify-between">
              <div className="flex gap-6">
                <Link
                  href="/best-sellers"
                  onClick={() => setShopOpen(false)}
                  className="flex items-center gap-1.5 text-sm text-[#C4704A] font-medium hover:underline"
                >
                  <Flame size={14} /> Best Sellers
                </Link>
                <Link
                  href="/categories"
                  onClick={() => setShopOpen(false)}
                  className="flex items-center gap-1.5 text-sm text-[#5C4033] hover:text-[#8B6914] transition-colors"
                >
                  <Sparkles size={14} /> New Arrivals
                </Link>
                <Link
                  href="/categories"
                  onClick={() => setShopOpen(false)}
                  className="flex items-center gap-1.5 text-sm text-[#5C4033] hover:text-[#8B6914] transition-colors"
                >
                  <Gift size={14} /> Gift Ideas
                </Link>
              </div>
              <Link
                href="/categories"
                onClick={() => setShopOpen(false)}
                className="text-xs font-medium text-[#2C1810] bg-[#F5EFE6] hover:bg-[#8B6914] hover:text-white px-4 py-2 rounded-full transition-all"
              >
                View All Products →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── SEARCH OVERLAY ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="bg-white rounded-2xl shadow-warm-xl w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-4 right-4 text-[#8A7060] hover:text-[#2C1810] transition-colors"
            >
              <X size={20} />
            </button>
            <p className="text-xs uppercase tracking-widest text-[#8A7060] mb-3">Search products</p>
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. baby onesie, feeding bottle…"
                className="flex-1 border border-[#E8E0D5] rounded-xl px-4 py-3 text-sm text-[#2C1810] placeholder:text-[#8A7060] focus:outline-none focus:border-[#8B6914] transition-colors"
              />
              <button
                type="submit"
                className="bg-[#8B6914] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#6B5310] transition-colors"
              >
                Search
              </button>
            </form>
            <div className="mt-4 flex gap-2 flex-wrap">
              {['Onesies', 'Feeding Set', 'Stroller', 'Baby Monitor', 'Gift Set'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    router.push(`/categories?search=${encodeURIComponent(t)}`);
                    setSearchOpen(false);
                  }}
                  className="text-xs text-[#5C4033] bg-[#F5EFE6] hover:bg-[#E8E0D5] px-3 py-1.5 rounded-full transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] bg-white overflow-y-auto lg:hidden">
          <div className="flex items-center justify-between px-6 h-16 border-b border-[#E8E0D5]">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
              <Image src="/images/logo.png" alt="Malaika Nest" width={36} height={36} />
              <span className="font-serif font-semibold text-[#2C1810]">Malaika Nest</span>
            </Link>
            <button onClick={() => setMobileOpen(false)}>
              <X size={22} className="text-[#5C4033]" />
            </button>
          </div>
          <div className="px-6 py-6 space-y-6">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block text-lg font-medium text-[#2C1810]">Home</Link>
            <Link href="/best-sellers" onClick={() => setMobileOpen(false)} className="block text-lg font-medium text-[#2C1810]">Best Sellers</Link>
            
            {/* Shop by Age Mobile */}
            <div>
              <p className="text-xs uppercase tracking-widest text-[#8A7060] mb-3">Shop by Age</p>
              <div className="flex flex-wrap gap-2">
                {SHOP_BY_AGE.slice(0, 6).map((age) => (
                  <Link
                    key={age.name}
                    href={age.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2 rounded-full border border-[#E8E0D5] text-sm text-[#5C4033] hover:bg-[#F5EFE6] hover:border-[#8B6914] transition-all"
                  >
                    {age.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories Mobile */}
            <div>
              <p className="text-xs uppercase tracking-widest text-[#8A7060] mb-3">Shop Categories</p>
              <div className="grid grid-cols-2 gap-3">
                {SHOP_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#F5EFE6] hover:bg-[#EDE3D8] transition-colors"
                  >
                    <cat.Icon className="w-6 h-6 text-[#8B6914]" />
                    <span className="text-sm font-medium text-[#2C1810]">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-[#E8E0D5] pt-6 space-y-3">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-[#5C4033]">
                <User size={18} /> Account / Login
              </Link>
              <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-[#5C4033]">
                <Heart size={18} /> Wishlist
              </Link>
              <Link href="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-[#5C4033]">
                <ShoppingBag size={18} /> Cart ({itemCount})
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
