'use client';

import React from 'react';
import { CartProvider } from '@/lib/cartContext';
import { WishlistProvider } from '@/lib/wishlistContext';
import { AuthProvider } from '@/lib/authContext';
import { Toaster } from '@/components/ui/sonner';
import { Toaster as HotToaster } from '@/components/ui/toaster';

/**
 * Top-level client providers: Auth + Cart + Wishlist + Toast.
 * Wrap the entire app body so any route can use these hooks.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>{children}</WishlistProvider>
      </CartProvider>
      <Toaster richColors position="top-center" />
      <HotToaster />
    </AuthProvider>
  );
}
