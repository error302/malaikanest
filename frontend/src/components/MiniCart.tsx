"use client"
import React from 'react'
import Link from 'next/link'

type Item = { id: string | number; image?: string; name: string; price: number; qty: number }

export default function MiniCart({ items = [], onRemove, onUpdateQty }: { items?: Item[]; onRemove?: (id: any) => void; onUpdateQty?: (id: any, qty: number) => void }) {
  const total = items.reduce((s, it) => s + (it.price * it.qty), 0)
  
  return (
    <div className="w-80 bg-white rounded-xl shadow-xl p-4 border border-secondary">
      <h4 className="font-semibold text-lg mb-3 text-text">Shopping Cart</h4>
      {items.length === 0 ? (
        <div className="text-sm text-gray-500 py-8 text-center">
          <span className="text-4xl block mb-2">🛒</span>
          Your cart is empty
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {items.map(it => (
            <div 
              key={it.id}
              className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg transition-all hover:bg-secondary/50"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {it.image ? (
                  <img src={it.image} className="w-full h-full object-cover" alt={it.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🧸</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text truncate">{it.name}</div>
                <div className="text-xs text-gray-500">Ksh {it.price.toLocaleString()} × {it.qty}</div>
                <div className="mt-1 flex items-center gap-1">
                  <button 
                    onClick={() => onUpdateQty && onUpdateQty(it.id, Math.max(1, it.qty - 1))} 
                    className="w-6 h-6 bg-white rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-sm w-6 text-center">{it.qty}</span>
                  <button 
                    onClick={() => onUpdateQty && onUpdateQty(it.id, it.qty + 1)} 
                    className="w-6 h-6 bg-white rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-sm font-semibold text-text whitespace-nowrap">
                Ksh {(it.price * it.qty).toLocaleString()}
              </div>
              <button 
                onClick={() => onRemove && onRemove(it.id)} 
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className="pt-3 mt-3 border-t border-secondary">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Subtotal</div>
            <div className="text-xl font-bold text-text">Ksh {total.toLocaleString()}</div>
          </div>
          <Link 
            href="/checkout" 
            className="block text-center w-full py-3 bg-cta hover:bg-cta-hover text-white font-semibold rounded-lg transition-colors"
          >
            Proceed to Checkout
          </Link>
          <Link 
            href="/" 
            className="block text-center w-full mt-2 py-2 text-sm text-gray-600 hover:text-accent transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  )
}
