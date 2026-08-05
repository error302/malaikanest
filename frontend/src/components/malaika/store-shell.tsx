'use client';

import React from 'react';
import { useCart } from '@/lib/cartContext';
import { useWishlist } from '@/lib/wishlistContext';
import { AnnouncementBar } from '@/components/malaika/announcement-bar';
import { Navbar } from '@/components/malaika/navbar';
import { MobileBottomNav } from '@/components/malaika/mobile-bottom-nav';
import { ScrollToTop } from '@/components/malaika/scroll-to-top';
import { CategoriesProvider } from '@/lib/categoriesContext';
import type { Branding } from '@/lib/settings';

/**
 * Wraps the storefront with live cart/wishlist counts injected into the Navbar
 * and MobileBottomNav. We render Navbar/MobileBottomNav here (passing
 * `branding` as a direct, serializable prop) rather than accepting them as
 * element-props from the server layout — Next.js cannot reliably serialize an
 * element that itself carries a complex object prop, which surfaced as a
 * "Element type is invalid" during static prerendering.
 *
 * Children = the page body (main + footer).
 */
interface StoreShellProps {
  branding: Branding;
  children: React.ReactNode;
}

export function StoreShell({ branding, children }: StoreShellProps) {
  const { items } = useCart();
  const { count: wishlistCount } = useWishlist();
  return (
    <CategoriesProvider>
      <div className="min-h-screen flex flex-col bg-grain pb-[calc(4rem_+_env(safe-area-inset-bottom))] lg:pb-0">
        <AnnouncementBar messages={branding.announcement_messages} />
        <Navbar branding={branding} cartCount={items.length} wishlistCount={wishlistCount} />
        {children}
        <MobileBottomNav cartCount={items.length} />
        <ScrollToTop />
      </div>
    </CategoriesProvider>
  );
}
