"use client"

import { CartProvider } from './cartContext'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <SpeedInsights />
      <Analytics />
      {children}
    </CartProvider>
  )
}
