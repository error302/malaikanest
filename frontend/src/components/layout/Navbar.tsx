'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, User, Heart, ChevronDown, X, Menu } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/authContext';

const SHOP_CATEGORIES = [
  {
    name: 'Clothing',
    href: '/categories',
    description: 'Onesies, rompers & more',
    emoji: '👗',
    color: 'bg-rose-50',
    featured: ['Newborn Sets', 'Toddler Tops', 'Sleepwear'],
  },
  {
    name: 'Baby Essentials',
    href: '/categories',
    description: 'Feeding, bathing & care',
    emoji: '🍼',
    color: 'bg-amber-50',
    featured: ['Feeding', 'Bath Time', 'Diapering'],
  },
  {
    name: 'Nursery',
    href: '/categories',
    description: 'Furniture, bedding & décor',
    emoji: '🛏️',
    color: 'bg-sky-50',
    featured: ['Bedding', 'Furniture', 'Lighting'],
  },
  {
    name: 'Toys & Learning',
    href: '/categories',
    description: 'Play, explore & grow',
    emoji: '🧸',
    color: 'bg-violet-50',
    featured: ['0–12 Months', 'Toddler Toys', 'Educational'],
  },
  {
    name: 'Travel & Safety',
    href: '/categories',
    description: 'Strollers, carriers & safety',
    emoji: '🚗',
    color: 'bg-green-50',
    featured: ['Strollers', 'Car Seats', 'Baby Carriers'],
  },
  {
    name: 'Gift Sets',
    href: '/categories',
    description: 'Curated bundles for every occasion',
    emoji: '🎁',
    color: 'bg-pink-50',
    featured: ['Newborn Gifts', 'Baby Shower', 'Milestone Gifts'],
  },
];

export default function Navbar() {
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const shopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { items } = useCart();
  const itemCount = items.length;
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openShop = () => {
    if (shopTimeoutRef.current) clearTimeout(shopTimeoutRef.current);
    setShopOpen(true);
  };

  const closeShop = () => {
    shopTimeoutRef.current = setTimeout(() => setShopOpen(false), 120);
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
      <div className="bg-[#1A3A2A] text-[#E8C98A] text-center text-xs py-2.5 px-4 font-light tracking-wide">
        🎁 Free delivery on orders over <strong className="font-semibold">KES 3,000</strong>
        &nbsp;·&nbsp; M-Pesa Till: <strong className="font-semibold">3370347</strong>
        &nbsp;·&nbsp; Same-day delivery in Mombasa
      </div>

      {/* Main nav */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/98 backdrop-blur-md shadow-sm border-b border-[#C9A96E]/15'
            : 'bg-[#FDF8F3] border-b border-[#C9A96E]/10'
        }`}
      >
        <div className="max-w-[1380px] mx-auto px-6 lg:px-10 flex items-center h-[68px] gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Malaika Nest"
              width={44}
              height={44}
              className="object-contain"
            />
            <div className="hidden sm:block leading-tight">
              <div className="font-serif text-xl font-semibold text-[#1A3A2A] tracking-tight">
                Malaika Nest
              </div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-[#8A7060] font-light">
                Baby &amp; Maternity
              </div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-7 flex-1">
            <Link
              href="/"
              className="text-sm text-[#5C4033] hover:text-[#1A3A2A] transition-colors"
            >
              Home
            </Link>

            {/* Shop mega menu trigger */}
            <div
              className="relative"
              onMouseEnter={openShop}
              onMouseLeave={closeShop}
            >
              <button
                className="flex items-center gap-1 text-sm text-[#5C4033] hover:text-[#1A3A2A] transition-colors font-medium"
                aria-expanded={shopOpen}
              >
                Shop
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            <Link
              href="/best-sellers"
              className="text-sm text-[#5C4033] hover:text-[#1A3A2A] transition-colors"
            >
              Best Sellers
            </Link>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F5EFE6] transition-colors text-[#5C4033]"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-[#F5EFE6] transition-colors text-[#5C4033]"
              aria-label="Wishlist"
            >
              <Heart size={18} />
            </Link>

            {/* Account */}
            {user ? (
              <Link
                href="/account"
                className="hidden md:flex items-center gap-2 h-9 px-3 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#5C4033] text-sm"
              >
                <User size={16} />
                <span className="text-xs leading-tight">
                  <span className="block font-medium">Account</span>
                  <span className="text-[10px] text-[#8A7060]">{user.email}</span>
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center gap-2 h-9 px-3 rounded-full hover:bg-[#F5EFE6] transition-colors text-[#5C4033] text-sm"
              >
                <User size={16} />
                <span className="text-xs leading-tight">
                  <span className="block font-medium">Account</span>
                  <span className="text-[10px] text-[#8A7060]">Login / Register</span>
                </span>
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="flex items-center gap-2 h-9 px-3 rounded-full border border-[#1A3A2A]/20 hover:border-[#1A3A2A] hover:bg-[#1A3A2A] hover:text-[#E8C98A] transition-all text-[#1A3A2A] text-sm group"
              aria-label="Cart"
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline text-xs font-medium">Cart</span>
              <span className="w-5 h-5 bg-[#C4704A] text-white rounded-full text-[10px] flex items-center justify-center font-semibold">
                {itemCount}
              </span>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F5EFE6] transition-colors text-[#5C4033]"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* ── MEGA MENU DROPDOWN ── */}
        <div
          onMouseEnter={openShop}
          onMouseLeave={closeShop}
          className={`absolute top-full left-0 right-0 bg-white border-t border-[#C9A96E]/20 shadow-2xl transition-all duration-200 origin-top ${
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
                  className="group flex flex-col rounded-2xl border border-[#E8E0D5] hover:border-[#C9A96E]/60 hover:shadow-md transition-all duration-200 overflow-hidden bg-white"
                >
                  <div
                    className={`${cat.color} h-28 flex items-center justify-center text-4xl transition-transform duration-200 group-hover:scale-105`}
                  >
                    {cat.emoji}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold text-[#1A3A2A] group-hover:text-[#C4704A] transition-colors">
                      {cat.name}
                    </div>
                    <div className="text-[11px] text-[#8A7060] mt-0.5 leading-snug">
                      {cat.description}
                    </div>
                    <ul className="mt-2 space-y-0.5">
                      {cat.featured.map((item) => (
                        <li
                          key={item}
                          className="text-[11px] text-[#5C4033] hover:text-[#C4704A] transition-colors leading-relaxed"
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
            <div className="mt-6 pt-5 border-t border-[#F0E8DE] flex items-center justify-between">
              <div className="flex gap-4">
                <Link
                  href="/best-sellers"
                  onClick={() => setShopOpen(false)}
                  className="text-sm text-[#C4704A] font-medium hover:underline"
                >
                  🔥 Best Sellers
                </Link>
                <Link
                  href="/categories"
                  onClick={() => setShopOpen(false)}
                  className="text-sm text-[#5C4033] hover:text-[#C4704A] transition-colors"
                >
                  ✨ New Arrivals
                </Link>
                <Link
                  href="/categories"
                  onClick={() => setShopOpen(false)}
                  className="text-sm text-[#5C4033] hover:text-[#C4704A] transition-colors"
                >
                  🎁 Gift Ideas
                </Link>
              </div>
              <Link
                href="/categories"
                onClick={() => setShopOpen(false)}
                className="text-xs font-medium text-[#1A3A2A] bg-[#F5EFE6] hover:bg-[#1A3A2A] hover:text-[#E8C98A] px-4 py-2 rounded-full transition-all"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-4 right-4 text-[#8A7060] hover:text-[#1A3A2A] transition-colors"
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
                className="flex-1 border border-[#E8E0D5] rounded-xl px-4 py-3 text-sm text-[#2C1810] placeholder:text-[#B0A090] focus:outline-none focus:border-[#1A3A2A] transition-colors"
              />
              <button
                type="submit"
                className="bg-[#1A3A2A] text-[#E8C98A] px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#254D38] transition-colors"
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
              <span className="font-serif font-semibold text-[#1A3A2A]">Malaika Nest</span>
            </Link>
            <button onClick={() => setMobileOpen(false)}>
              <X size={22} className="text-[#5C4033]" />
            </button>
          </div>
          <div className="px-6 py-6 space-y-6">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block text-lg font-medium text-[#1A3A2A]">Home</Link>
            <Link href="/best-sellers" onClick={() => setMobileOpen(false)} className="block text-lg font-medium text-[#1A3A2A]">Best Sellers</Link>
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
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-sm font-medium text-[#1A3A2A]">{cat.name}</span>
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
