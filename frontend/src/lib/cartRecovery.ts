'use client';

/**
 * Tracks cart abandonment in localStorage.
 * When a user adds items but doesn't checkout within 1 hour, the cart is
 * considered "abandoned" and shows up in the admin dashboard.
 *
 * In production, wire this to the Django backend's /api/v1/orders/cart/
 * endpoint to persist across devices and trigger email/SMS reminders.
 */

const ABANDONED_KEY = 'malaika_abandoned_cart';
const ABANDON_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

export interface AbandonedCart {
  items: Array<{ id: string; name: string; price: number; qty: number; image?: string }>;
  total: number;
  startedAt: string;  // ISO timestamp when first item was added
  lastUpdatedAt: string;
  guestEmail?: string;
}

export function trackCartActivity(items: Array<{ id: string; name: string; price: number; qty: number; image?: string }>, total: number) {
  if (typeof window === 'undefined') return;
  if (items.length === 0) {
    localStorage.removeItem(ABANDONED_KEY);
    return;
  }

  try {
    const existing = localStorage.getItem(ABANDONED_KEY);
    const now = new Date().toISOString();
    const cart: AbandonedCart = existing
      ? { ...JSON.parse(existing), items, total, lastUpdatedAt: now }
      : { items, total, startedAt: now, lastUpdatedAt: now };
    localStorage.setItem(ABANDONED_KEY, JSON.stringify(cart));
  } catch {
    // localStorage may be unavailable
  }
}

export function clearAbandonedCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ABANDONED_KEY);
}

export function getAbandonedCart(): AbandonedCart | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ABANDONED_KEY);
    if (!raw) return null;
    const cart = JSON.parse(raw) as AbandonedCart;
    // Check if it's actually abandoned (last updated > 1 hour ago)
    const lastUpdated = new Date(cart.lastUpdatedAt).getTime();
    if (Date.now() - lastUpdated > ABANDON_THRESHOLD_MS) {
      return cart;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Show a recovery banner if the user has an abandoned cart.
 * Call this on the homepage or any high-traffic page.
 */
export function shouldShowRecoveryBanner(): boolean {
  return getAbandonedCart() !== null;
}
