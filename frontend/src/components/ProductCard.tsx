"use client"

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, ShoppingCart } from 'lucide-react'

import { useCart } from '../lib/cartContext'
import { getImageUrl, shouldUseUnoptimizedImage } from '../lib/media'

interface Props {
  product: any
}

export default function ProductCard({ product }: Props) {
  const { add } = useCart()

  const inStock = product.stock === undefined || product.stock > 0
  const imageSrc = product.image || product.images?.[0] || null
  const imageUrl = getImageUrl(imageSrc)

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!inStock) return

    await add({
      id: product.id || product.slug,
      name: product.name,
      price: parseFloat(product.price),
      image: imageSrc || '',
      qty: 1,
      slug: product.slug,
    })
  }

  return (
    <article className={`product-card group rounded-[12px] border border-default bg-surface p-3 sm:p-4 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] ${!inStock ? 'opacity-70' : ''}`}>
      <Link href={`/products/${product.slug}`} className="block w-full">
        <div className="aspect-square w-full">
          {imageUrl && imageUrl !== '/images/placeholder.png' ? (
            <Image 
              src={imageUrl} 
              alt={product.name} 
              fill 
              className="object-cover transition duration-500 group-hover:scale-105" 
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" 
              unoptimized={shouldUseUnoptimizedImage(imageSrc)} 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)]">
              <span className="font-display text-4xl sm:text-5xl text-[var(--text-primary)]">{String(product.name || 'P').charAt(0)}</span>
            </div>
          )}

          {!inStock && (
            <span className="absolute left-3 top-3 z-10 rounded-full border border-default bg-surface px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              Out of Stock
            </span>
          )}
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            {product.category?.name || 'Malaika Nest'}
          </p>

          <Link href={`/products/${product.slug}`}>
            <h3 className="mt-2 line-clamp-2 text-[17px] font-semibold text-[var(--text-primary)] sm:text-[19px]">{product.name}</h3>
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="whitespace-nowrap text-[15px] font-semibold text-[var(--text-primary)] sm:text-base">KES {parseFloat(product.price).toLocaleString()}</p>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`${inStock ? 'btn-primary' : 'btn-secondary cursor-not-allowed opacity-60'} inline-flex items-center justify-center p-2 rounded-lg sm:px-4`}
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline ml-2">Add</span>
          </button>
        </div>
      </div>
    </article>
  )
}
