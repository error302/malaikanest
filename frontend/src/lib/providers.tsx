"use client"

import { CartProvider } from './cartContext'
import { AuthProvider } from './authContext'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <CartProvider>
          <SpeedInsights />
          <Analytics />
          {children}
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
