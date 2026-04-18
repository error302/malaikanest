'use client'

import { CartProvider } from '@/lib/cartContext'
import { AuthProvider } from '@/lib/authContext'
import { WishlistProvider } from '@/lib/wishlistContext'
import Navbar from '@/components/layout/Navbar'
import TrustBar from '@/components/layout/TrustBar'
import Footer from '@/components/layout/Footer'
import MobileNav from '@/components/layout/MobileNav'
import { ToastContainer } from '@/components/Toast'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col bg-[#FDF8F3]">
            <Navbar />
            <main className="flex-1 pb-20 lg:pb-0">{children}</main>
            <TrustBar />
            <Footer />
          </div>
          <MobileNav />
          <ToastContainer />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  )
}
