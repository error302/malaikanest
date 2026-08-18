'use client';

import { create } from 'zustand';

/**
 * UI store for the slide-over cart drawer. Decoupled from the cart data context
 * (cartContext.tsx) so any component can open the drawer (e.g. product card's
 * "Quick Add" button) without prop-drilling. The drawer is rendered once at the
 * store-shell level and reads this store for its open/close state.
 */
interface CartDrawerState {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggle: () => void;
}

export const useCartDrawer = create<CartDrawerState>((set) => ({
  open: false,
  openDrawer: () => set({ open: true }),
  closeDrawer: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
