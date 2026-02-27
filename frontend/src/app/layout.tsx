import './globals.css'
import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Providers } from '../lib/providers'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'https://malaikanest.shop'),
  title: {
    default: 'Malaika Nest - Premium Baby Clothes in Kenya',
    template: '%s | Malaika Nest'
  },
  description: 'Trusted online baby store in Kenya. Shop safe, quality baby products with secure M-Pesa payments. Free delivery in Nairobi, Mombasa, Kisumu and across Kenya.',
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
    url: 'https://malaikanest.shop',
    siteName: 'Malaika Nest',
    title: 'Malaika Nest - Premium Baby Clothes in Kenya',
    description: 'Trusted online baby store in Kenya. Shop safe, quality baby products with secure M-Pesa payments.',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Malaika Nest - Quality Baby Products',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Malaika Nest - Premium Baby Clothes',
    description: 'Trusted online baby store with secure M-Pesa payments',
    images: ['/logo.svg'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/logo-compact.svg" />
        <meta name="theme-color" content="#FFD6E0" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Malaika Nest",
              "url": "https://malaikanest.shop",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://malaikanest.shop/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "description": "Trusted online baby store in Kenya with secure M-Pesa payments"
            })
          }}
        />
      </head>
      <body className="bg-primary text-text antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
