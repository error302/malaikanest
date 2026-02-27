"use client"
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '../lib/cartContext'

interface Props {
  product: any
}

function ProductCardInner({ product }: Props) {
  const { add } = useCart()

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-[4/3] bg-secondary relative overflow-hidden group">
          {product.images?.length ? (
            <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">🧸</span>
            </div>
          )}
          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-white px-4 py-2 rounded-full text-sm font-medium text-text">
              Quick View
            </span>
          </div>
          {/* Badge */}
          {product.is_new && (
            <div className="absolute top-2 left-2 bg-accent text-white text-xs px-2 py-1 rounded-full">
              New
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="font-semibold text-text line-clamp-2 hover:text-accent transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-lg font-bold text-text">Ksh {parseFloat(product.price).toLocaleString()}</div>
          <div className="text-xs text-gray-500">{product.stock > 0 ? 'In stock' : 'Out of stock'}</div>
        </div>
        <button 
          onClick={() => add({ id: product.id || product.slug, name: product.name, price: product.price, image: product.images?.[0], qty: 1, slug: product.slug })} 
          className="w-full mt-3 bg-cta text-white py-2.5 rounded-lg text-sm font-medium hover:bg-cta-hover transition-all active:scale-95"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}

export default ProductCardInner
