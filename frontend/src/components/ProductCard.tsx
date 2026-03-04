"use client"
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '../lib/cartContext'
import { ShoppingCart, Star } from 'lucide-react'

interface Props {
  product: any
}

function ProductCardInner({ product }: Props) {
  const { add } = useCart()

  return (
    <div className="bg-card rounded-card overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 border border-border hover:border-accent group">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-[4/3] bg-card-hover relative overflow-hidden">
          {product.images?.length ? (
            <Image 
              src={product.images[0]} 
              alt={product.name} 
              fill 
              className="object-cover group-hover:scale-110 transition-transform duration-500" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">🧸</span>
            </div>
          )}
          {/* Badge */}
          {product.is_new && (
            <div className="absolute top-3 left-3 bg-accent text-white text-xs px-3 py-1 rounded-tag font-medium">
              New
            </div>
          )}
          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-white text-primary px-4 py-2 rounded-full text-sm font-medium">
              Quick View
            </span>
          </div>
        </div>
      </Link>
      <div className="p-5">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="font-semibold text-white line-clamp-2 hover:text-accent transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-muted text-[13px] mt-1">by {product.seller?.name || 'Kenya Baby'}</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-white">KES {parseFloat(product.price).toLocaleString()}</span>
            {product.original_price && (
              <span className="text-sm text-muted line-through ml-2">
                KES {parseFloat(product.original_price).toLocaleString()}
              </span>
            )}
          </div>
          <button 
            onClick={() => add({ id: product.id || product.slug, name: product.name, price: product.price, image: product.images?.[0], qty: 1, slug: product.slug })} 
            className="w-9 h-9 flex items-center justify-center bg-accent hover:bg-accent-hover rounded-button transition-all hover:scale-105"
          >
            <ShoppingCart className="w-4 h-4 text-white" />
          </button>
        </div>
        {/* Rating */}
        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              className={`w-3 h-3 ${star <= (product.rating || 4) ? 'text-warning fill-warning' : 'text-muted'}`} 
            />
          ))}
          <span className="text-xs text-muted ml-1">({product.reviews_count || 0})</span>
        </div>
      </div>
    </div>
  )
}

export default ProductCardInner

