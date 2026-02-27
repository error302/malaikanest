"use client"

import { ReactNode } from 'react'
import { CartProvider } from './cartContext'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <CartProvider>
      <SpeedInsights />
      <Analytics />
      {children}
    </CartProvider>
  )
}
