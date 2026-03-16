import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, X } from 'lucide-react'

import { useCart } from '../lib/cartContext'
import { getImageUrl } from '../lib/media'
import SmartImage from './SmartImage'

interface Props {
  product: any
}

export default function ProductCard({ product }: Props) {
  const { add } = useCart()
  const [isFullscreen, setIsFullscreen] = useState(false)

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

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFullscreen(!isFullscreen)
  }

  return (
    <>
      <article className="w-full flex flex-col bg-white rounded-2xl border border-default overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
        {/* Product Image */}
        <div 
          className="relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-[var(--bg-secondary)]" 
          onClick={toggleFullscreen}
        >
          {imageUrl && imageUrl !== '/placeholder.svg' ? (
            <SmartImage 
              src={imageUrl} 
              alt={product.name} 
              fill 
              className="object-cover" 
              sizes="(max-width: 640px) 100vw, 300px" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-secondary">
              <span className="text-4xl text-text-muted">{String(product.name || 'P').charAt(0)}</span>
            </div>
          )}
          
          {!inStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-black text-white px-3 py-1 text-xs font-bold rounded">OUT OF STOCK</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4 flex flex-col flex-1">
          <Link href={`/products/${product.slug}`} className="group/link">
            <h3 className="text-[15px] font-semibold line-clamp-2 text-text-primary min-h-[2.5rem] transition-colors group-hover/link:text-[var(--link-hover)]">
              {product.name}
            </h3>
          </Link>
          
          <p className="mt-2 text-[16px] font-semibold text-text-primary">
            KES {parseFloat(product.price).toLocaleString()}
          </p>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            aria-label="Add to cart"
            title={inStock ? "Add to cart" : "Out of stock"}
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${!inStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-800'}`}
          >
            <ShoppingCart size={16} aria-hidden="true" />
            <span>{inStock ? "Add to cart" : "Out of stock"}</span>
          </button>
        </div>
      </article>

      {/* Fullscreen Image Preview */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          <button 
            type="button"
            className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => setIsFullscreen(false)}
            aria-label="Close image preview"
            title="Close"
          >
            <X size={24} />
          </button>
          <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
            <SmartImage 
              src={imageUrl} 
              alt={product.name} 
              fill 
              className="object-contain"
            />
          </div>
          <p className="absolute bottom-10 text-white text-lg font-medium">{product.name}</p>
        </div>
      )}
    </>
  )
}
