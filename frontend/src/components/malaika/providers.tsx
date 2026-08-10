'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { CartProvider } from '@/lib/cartContext';
import { WishlistProvider } from '@/lib/wishlistContext';
import { AuthProvider } from '@/lib/authContext';
import { I18nProvider } from '@/lib/i18n';
import { Toaster } from '@/components/ui/sonner';
import { Toaster as HotToaster } from '@/components/ui/toaster';
import { CookieConsent } from '@/components/malaika/cookie-consent';
import { WhatsAppButton } from '@/components/malaika/whatsapp-button';

/**
 * Top-level client providers: Theme + I18n + Auth + Cart + Wishlist + Toast + Cookie consent + WhatsApp.
 * ThemeProvider enables light/dark mode switching via `useTheme()`. We default to
 * light and don't auto-follow the OS — the editorial-premium aesthetic is
 * tuned for the light/paper palette, and dark mode is opt-in for users who want it.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <I18nProvider>
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
      </I18nProvider>
    </ThemeProvider>
  );
}
