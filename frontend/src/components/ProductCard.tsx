import Link from 'next/link'
import { useState } from 'react'
import { X } from 'lucide-react'

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
      <article className="w-full flex flex-col bg-white rounded-lg border border-default overflow-hidden">
        {/* Product Image */}
        <div 
          className="relative w-full h-48 cursor-zoom-in overflow-hidden" 
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
        <div className="p-3 flex flex-col flex-1">
          <Link href={`/products/${product.slug}`} className="hover:underline">
            <h3 className="text-sm font-medium line-clamp-2 text-text-primary h-10">
              {product.name}
            </h3>
          </Link>
          
          <p className="mt-1 text-base font-semibold text-text-primary">
            KES {parseFloat(product.price).toLocaleString()}
          </p>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            aria-label="Add to cart"
            title={inStock ? "Add to cart" : "Out of stock"}
            className={`mt-3 w-full bg-black text-white py-2 rounded-lg text-xl flex items-center justify-center min-h-[44px] transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${!inStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
          >
            <span aria-hidden="true">🛒</span>
            <span className="sr-only">Add to cart</span>
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
