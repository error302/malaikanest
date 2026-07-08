'use client';

/**
 * Tracks recently viewed products in localStorage.
 * Keeps the last 8 unique products (most recent first).
 */

const STORAGE_KEY = 'malaika_recently_viewed';
const MAX_ITEMS = 8;

export interface RecentlyViewedItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  image?: string;
  category?: string;
  viewedAt: string;
}

export function trackRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecentlyViewed();
    // Remove if already exists (avoid duplicates)
    const filtered = existing.filter((p) => p.id !== item.id);
    // Add to front
    const updated = [{ ...item, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable
  }
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
