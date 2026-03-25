"use client"

import { CartProvider } from './cartContext'
import { AuthProvider } from './authContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  )
}
