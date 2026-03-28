'use client'

import { CartProvider } from '@/lib/cartContext'
import { AuthProvider } from '@/lib/authContext'
import { WishlistProvider } from '@/lib/wishlistContext'
import Navbar from '@/components/layout/Navbar'
import TrustBar from '@/components/layout/TrustBar'
import Footer from '@/components/layout/Footer'
import { ToastContainer } from '@/components/Toast'
import Chatbot from '@/components/Chatbot'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <TrustBar />
            <Footer />
          </div>
          <Chatbot />
          <ToastContainer />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  )
}
