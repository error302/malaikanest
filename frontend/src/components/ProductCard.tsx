"use client"
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '../lib/cartContext'
import { ShoppingCart, Star } from 'lucide-react'

interface Props {
  product: any
}

export default function ProductCard({ product }: Props) {
  const { add } = useCart()
  const inStock = product.stock === undefined || product.stock > 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (inStock) {
      add({ 
        id: product.id || product.slug, 
        name: product.name, 
        price: product.price, 
        image: product.images?.[0], 
        qty: 1, 
        slug: product.slug 
      })
    }
  }

  return (
    <div className={`bg-[var(--bg-card)] rounded-[20px] overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 border border-[var(--border)] hover:border-[var(--accent)] group ${!inStock ? 'opacity-75' : ''}`}>
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-[4/3] bg-[var(--bg-card-hover)] relative overflow-hidden">
          {product.images?.length ? (
            <Image 
              src={product.images[0]} 
              alt={product.name} 
              fill 
              className="object-cover group-hover:scale-110 transition-transform duration-500" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)]">
              <span className="text-4xl">🧸</span>
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.is_new && (
              <div className="bg-[var(--accent)] text-white text-xs px-3 py-1 rounded-[8px] font-medium">
                New
              </div>
            )}
            {!inStock && (
              <div className="bg-[var(--text-muted)]/20 text-[var(--text-muted)] text-xs px-2 py-1 rounded-[8px]">
                Out of Stock
              </div>
            )}
          </div>
          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-white text-[var(--text-primary)] px-4 py-2 rounded-full text-sm font-medium">
              Quick View
            </span>
          </div>
        </div>
      </Link>
      <div className="p-5">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 hover:text-[var(--accent)] transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-[var(--text-muted)] text-[13px] mt-1">by {product.seller?.name || 'Malaika Nest'}</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-[var(--text-primary)]">KES {parseFloat(product.price).toLocaleString()}</span>
            {product.original_price && (
              <span className="text-sm text-[var(--text-muted)] line-through ml-2">
                KES {parseFloat(product.original_price).toLocaleString()}
              </span>
            )}
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`w-9 h-9 flex items-center justify-center rounded-[12px] transition-all hover:scale-105 ${inStock ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] cursor-pointer' : 'bg-[var(--text-muted)]/20 cursor-not-allowed opacity-50'}`}
          >
            <ShoppingCart className="w-4 h-4 text-white" />
          </button>
        </div>
        {/* Rating */}
        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              className={`w-3 h-3 ${star <= (product.rating || 4) ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--text-muted)]'}`} 
            />
          ))}
          <span className="text-xs text-[var(--text-muted)] ml-1">({product.reviews_count || 0})</span>
        </div>
      </div>
    </div>
  )
}

