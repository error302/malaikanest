'use client';

import React from 'react';
import { useCart } from '@/lib/cartContext';
import { useWishlist } from '@/lib/wishlistContext';

/**
 * Wraps the storefront with live cart/wishlist counts injected into
 * the Navbar and MobileBottomNav. Children = the page body (main + footer).
 */
interface StoreShellProps {
  announcement?: React.ReactNode;
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

export function StoreShell({ announcement, navbar, mobileNav, children }: StoreShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-grain">
      {announcement}
      <NavbarWithCounts navbar={navbar} />
      {children}
      <MobileNavWithCounts mobileNav={mobileNav} />
    </div>
  );
}
