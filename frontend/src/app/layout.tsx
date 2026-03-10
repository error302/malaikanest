import './globals.css'
import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Providers } from '../lib/providers'
import { ToastContainer } from '../components/Toast'

export const metadata = {
  metadataBase: new URL('https://malaikanest.duckdns.org'),
  title: {
    default: 'Malaika Nest - Baby Products & Toys in Kenya',
    template: '%s | Malaika Nest',
  },
  description: 'Shop premium baby products, accessories and toys in Kenya. Secure M-Pesa payments, fast delivery nationwide.',
  viewport: 'width=device-width, initial-scale=1.0',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/logo-compact.svg" />
        <meta name="theme-color" content="#FFF9F5" />
      </head>
      <body className="bg-primary text-primary font-body antialiased transition-colors duration-300">
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  )
}
