import './globals.css'
import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Providers } from '../lib/providers'
import { ToastContainer } from '../components/Toast'
import AIChatWidget from '../components/AIChatWidget'
import DarkModeToggle from '../components/DarkModeToggle'
import { Space_Grotesk, Inter, Playfair_Display } from 'next/font/google'

// Configure fonts
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://malaikanest.duckdns.org'),
  title: {
    default: 'Malaika Nest — Baby Products & Toys in Kenya',
    template: '%s | Malaika Nest'
  },
  description: 'Shop premium baby products, accessories and toys in Kenya. Secure M-Pesa payments, fast delivery nationwide.',
  keywords: ['baby shop Kenya', 'baby products Kenya', 'M-Pesa payments', 'baby store Nairobi', 'infant supplies Kenya', 'safe baby products', 'Malaika Nest'],
  authors: [{ name: 'Malaika Nest' }],
  creator: 'Malaika Nest',
  publisher: 'Malaika Nest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://malaikanest.duckdns.org',
    siteName: 'Malaika Nest',
    title: 'Malaika Nest — Baby Products & Toys in Kenya',
    description: 'Shop premium baby products, accessories and toys in Kenya. Secure M-Pesa payments, fast delivery nationwide.',
    images: [
      {
        url: '/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'Malaika Nest - Quality Baby Products',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Malaika Nest — Baby Products & Toys',
    description: 'Shop premium baby products with secure M-Pesa payments',
    images: ['/images/logo.png'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/logo-compact.svg" />
        <meta name="theme-color" content="#FFFDF7" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Malaika Nest",
              "url": "https://malaikanest.duckdns.org",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://malaikanest.duckdns.org/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "description": "Trusted online baby store in Kenya with secure M-Pesa payments"
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased font-body transition-colors duration-300">
        <Providers>
          {/* Top Banner */}
          <div className="top-banner text-xs sm:text-sm py-2 px-4 text-center">
            <span className="hidden sm:inline">🎀 Free Kenyan Delivery on Orders Over KSh 10,000! </span>
            <span className="sm:hidden">🎀 Free Delivery Over KSh 10,000!</span>
            <span className="mx-2">•</span>
            <span>Secure M-Pesa Payments</span>
          </div>
          
          <Navbar />
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
          <Footer />
          <ToastContainer />
          <AIChatWidget />
        </Providers>
      </body>
    </html>
  )
}

