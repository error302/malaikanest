'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { showToast } from '@/lib/toast';

export type WishlistItem = {
  id: string;
  productId: number;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
  categoryName?: string;
  availableStock?: number;
  hasVariants?: boolean;
};

type WishlistContextType = {
  items: WishlistItem[];
  count: number;
  add: (item: WishlistItem) => void;
  remove: (productId: number) => void;
  toggle: (item: WishlistItem) => void;
  contains: (productId: number) => boolean;
  clear: () => void;
};

const STORAGE_KEY = 'malaika_wishlist_v1';

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // ignore parse errors
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [hydrated, items]);

  const add = useCallback((item: WishlistItem) => {
    setItems((current) => {
      if (current.some((entry) => entry.productId === item.productId)) {
        return current;
      }
      showToast('Saved to wishlist', 'success');
      return [item, ...current];
    });
  }, []);

  const remove = useCallback((productId: number) => {
    setItems((current) => {
      const exists = current.some((entry) => entry.productId === productId);
      if (exists) {
        showToast('Removed from wishlist', 'info');
      }
      return current.filter((entry) => entry.productId !== productId);
    });
  }, []);

  const toggle = useCallback((item: WishlistItem) => {
    setItems((current) => {
      const exists = current.some((entry) => entry.productId === item.productId);
      if (exists) {
        showToast('Removed from wishlist', 'info');
        return current.filter((entry) => entry.productId !== item.productId);
      }

      showToast('Saved to wishlist', 'success');
      return [item, ...current];
    });
  }, []);

  const contains = useCallback(
    (productId: number) => items.some((item) => item.productId === productId),
    [items]
  );

  const clear = useCallback(() => {
    setItems([]);
    showToast('Wishlist cleared', 'info');
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      add,
      remove,
      toggle,
      contains,
      clear,
    }),
    [items, add, remove, toggle, contains, clear]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
