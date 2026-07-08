'use client';

import React from 'react';
import { CartProvider } from '@/lib/cartContext';
import { WishlistProvider } from '@/lib/wishlistContext';
import { AuthProvider } from '@/lib/authContext';
import { Toaster } from '@/components/ui/sonner';
import { Toaster as HotToaster } from '@/components/ui/toaster';
import { CookieConsent } from '@/components/malaika/cookie-consent';
import { WhatsAppButton } from '@/components/malaika/whatsapp-button';

/**
 * Top-level client providers: Auth + Cart + Wishlist + Toast + Cookie consent + WhatsApp.
 * Wrap the entire app body so any route can use these hooks and features.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
          <WhatsAppButton />
        </WishlistProvider>
      </CartProvider>
      <CookieConsent />
      <Toaster richColors position="top-center" />
      <HotToaster />
    </AuthProvider>
  );
}
