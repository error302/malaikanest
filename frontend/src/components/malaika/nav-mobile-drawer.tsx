'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { X, User, Package, Settings, LogOut, Heart, ShoppingCart } from 'lucide-react';
import { Logo } from '@/components/malaika/logo';
import { useI18n } from '@/lib/i18n';
import { getCategoryImage } from '@/lib/category-images';
import type { Branding } from '@/lib/settings';

interface NavMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  branding?: Branding;
  navLinks: { nameKey: string; href: string }[];
  shopByAge: { label: string; slug: string; image: string }[];
  categories: any[];
  fallbackColors: string[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: any;
  userInitial: string;
  onLogout: () => void;
  wishlistCount: number;
  cartCount: number;
}

export function NavMobileDrawer({
  isOpen,
  onClose,
  branding,
  navLinks,
  shopByAge,
  categories,
  fallbackColors,
  isAuthenticated,
  isAdmin,
  user,
  userInitial,
  onLogout,
  wishlistCount,
  cartCount,
}: NavMobileDrawerProps) {
  const { t } = useI18n();

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
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
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
          style={{ color: 'var(--brand-brown)' }}
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>

      <div className="px-5 py-6 space-y-6">
        <nav className="space-y-1" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.nameKey}
              href={link.href}
              onClick={onClose}
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
            {shopByAge.slice(0, 6).map((age) => (
              <Link
                key={age.label}
                href={`/categories?age=${age.slug}`}
                onClick={onClose}
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
                onClick={onClose}
                className="flex items-center gap-2.5 p-3 rounded-xl transition-colors border"
                style={{ 
                  background: '#FFFFFF',
                  borderColor: 'var(--brand-border)'
                }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                  style={{ background: fallbackColors[idx % fallbackColors.length] }}
                >
                  <Image
                    src={getCategoryImage(cat)}
                    alt={cat.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
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
            onClick={onClose}
            className="flex items-center gap-3 text-sm py-2"
            style={{ color: 'var(--brand-brown)' }}
          >
            <User size={18} /> {isAuthenticated ? 'My Account' : `Account / ${t('nav.signin')}`}
          </Link>
          {isAuthenticated && (
            <>
              <Link
                href="/account/orders"
                onClick={onClose}
                className="flex items-center gap-3 text-sm py-2"
                style={{ color: 'var(--brand-brown)' }}
              >
                <Package size={18} /> My Orders
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 text-sm py-2"
                  style={{ color: 'var(--brand-brown)' }}
                >
                  <Settings size={18} /> Admin Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
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
            onClick={onClose}
            className="flex items-center gap-3 text-sm py-2"
            style={{ color: 'var(--brand-brown)' }}
          >
            <Heart size={18} /> {t('nav.wishlist')} ({wishlistCount})
          </Link>
          <Link
            href="/cart"
            onClick={onClose}
            className="flex items-center gap-3 text-sm py-2"
            style={{ color: 'var(--brand-brown)' }}
          >
            <ShoppingCart size={18} /> {t('nav.cart')} ({cartCount})
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
