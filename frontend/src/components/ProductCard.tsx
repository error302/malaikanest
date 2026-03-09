"use client"

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'

import { useCart } from '../lib/cartContext'
import { shouldUseUnoptimizedImage } from '../lib/media'

interface Props {
  product: any
}

export default function ProductCard({ product }: Props) {
  const { add } = useCart()

  const inStock = product.stock === undefined || product.stock > 0
  const imageSrc = product.image || product.images?.[0] || null

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
    <article className={`group rounded-[12px] border border-default bg-surface p-4 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] ${!inStock ? 'opacity-70' : ''}`}>
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-[12px] bg-[var(--bg-soft)]">
          {imageSrc ? (
            <Image src={imageSrc} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-105" unoptimized={shouldUseUnoptimizedImage(imageSrc)} />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)]">
              <span className="font-display text-5xl text-[var(--text-primary)]">{String(product.name || 'P').charAt(0)}</span>
            </div>
          )}

          {!inStock && (
            <span className="absolute left-3 top-3 rounded-full border border-default bg-surface px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              Out of Stock
            </span>
          )}
        </div>
      </Link>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          {product.category?.name || 'Malaika Nest'}
        </p>

        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-2 line-clamp-2 text-[19px] font-semibold text-[var(--text-primary)]">{product.name}</h3>
        </Link>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-[var(--text-primary)]">KES {parseFloat(product.price).toLocaleString()}</p>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            className={inStock ? 'btn-primary inline-flex items-center gap-2 px-4' : 'btn-secondary inline-flex cursor-not-allowed items-center gap-2 px-4 opacity-60'}
          >
            <span className="text-lg">🛒</span>
          </button>
        </div>
      </div>
    </article>
  )
}
