"use client"

import { CartProvider } from './cartContext'
import { AuthProvider } from './authContext'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  const enableVercelAnalytics = process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === 'true'

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <CartProvider>
          {enableVercelAnalytics && (
            <>
              <SpeedInsights />
              <Analytics />
            </>
          )}
          {children}
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

