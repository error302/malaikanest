import './globals.css'
import React from 'react'
import type { Metadata, Viewport } from 'next'
import Navbar from '@/components/layout/Navbar'
import TrustBar from '@/components/layout/TrustBar'
import Footer from '@/components/layout/Footer'
import { Providers } from '@/lib/providers'
import { ToastContainer } from '@/components/Toast'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://malaikanest.duckdns.org'),
  title: {
    default: 'Malaika Nest - Baby Products & Toys in Kenya',
    template: '%s | Malaika Nest',
  },
  description: 'Shop premium baby products, accessories and toys in Kenya. Secure M-Pesa payments, fast delivery nationwide.',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Malaika Nest',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/logo-compact.svg" />
        <meta name="theme-color" content="#FDF8F3" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <TrustBar />
          <Footer />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  )
}
