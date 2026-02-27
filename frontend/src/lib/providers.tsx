"use client"

import { ReactNode } from 'react'
import { CartProvider } from './cartContext'
import { SpeedInsights } from '@vercel/speed-insights/next'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <CartProvider>
      <SpeedInsights />
      {children}
    </CartProvider>
  )
}
