'use client';

import React from 'react';
import { useCart } from '@/lib/cartContext';
import { useWishlist } from '@/lib/wishlistContext';
import { AnnouncementBar } from '@/components/malaika/announcement-bar';
import type { Branding } from '@/lib/settings';

/**
 * Wraps the storefront with live cart/wishlist counts injected into
 * the Navbar and MobileBottomNav. Children = the page body (main + footer).
 */
interface StoreShellProps {
  branding: Branding;
  navbar: React.ReactNode;
  mobileNav: React.ReactNode;
  children: React.ReactNode;
}

function NavbarWithCounts({ navbar }: { navbar: React.ReactElement }) {
  const { items } = useCart();
  const { count: wishlistCount } = useWishlist();
  return React.cloneElement(navbar, {
    cartCount: items.length,
    wishlistCount,
  } as { cartCount: number; wishlistCount: number });
}

function MobileNavWithCounts({ mobileNav }: { mobileNav: React.ReactElement }) {
  const { items } = useCart();
  return React.cloneElement(mobileNav, {
    cartCount: items.length,
  } as { cartCount: number });
}

export function StoreShell({ branding, navbar, mobileNav, children }: StoreShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-grain">
      <AnnouncementBar messages={branding.announcement_messages} />
      <NavbarWithCounts navbar={navbar} />
      {children}
      <MobileNavWithCounts mobileNav={mobileNav} />
    </div>
  );
}
