"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Heart, ShieldCheck, ShoppingBasket, Truck, ChevronRight, Star, Package } from 'lucide-react'

import api from '@/lib/api'
import { shouldUseUnoptimizedImage } from '@/lib/media'
import { useCart } from '@/lib/cartContext'
import { useWishlist } from '@/lib/wishlistContext'
import ReviewSection from '@/components/ReviewSection'

interface Product {
  id: number
  name: string
  slug: string
  price: string
  description: string
  category?: { id: number; name: string; slug: string; full_slug?: string }
  image: string | null
  stock: number
  available_stock?: number
  variants?: Array<{
    id: number
    color?: string
    color_label?: string
    size?: string
    size_label?: string
    sku?: string
    image?: string | null
    effective_price?: string
    available_stock?: number
  }>
}

// Mock related products - in production this would come from API
const MOCK_RELATED_PRODUCTS = [
  { id: 1, name: 'Organic Cotton Onesie', slug: 'organic-cotton-onesie', price: '1,250', image: null },
  { id: 2, name: 'Baby Romper Set', slug: 'baby-romper-set', price: '2,450', image: null },
  { id: 3, name: 'Soft Cotton Blanket', slug: 'soft-cotton-blanket', price: '1,800', image: null },
  { id: 4, name: 'Newborn Gift Set', slug: 'newborn-gift-set', price: '3,200', image: null },
];

// Trust badges for product page
const TRUST_BADGES = [
  { icon: '🇰🇪', label: 'Made with love\nin Kenya' },
  { icon: '✓', label: 'TRUST\nSecure Payments' },
  { icon: '🚚', label: 'FREE\nShopping' },
];

function DetailSkeleton() {
  return (
    <div className="py-12">
      <div className="max-w-[1380px] mx-auto px-6 lg:px-16">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 bg-[#F5EFE6] rounded animate-pulse mb-8" />
        
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Image skeleton */}
          <div className="aspect-square animate-pulse rounded-2xl bg-[#F5EFE6]" />
          
          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="h-4 w-24 bg-[#F5EFE6] rounded animate-pulse" />
            <div className="h-12 w-3/4 bg-[#F5EFE6] rounded animate-pulse" />
            <div className="h-8 w-1/3 bg-[#F5EFE6] rounded animate-pulse" />
            <div className="h-32 bg-[#F5EFE6] rounded animate-pulse" />
            <div className="h-12 w-full bg-[#F5EFE6] rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const { add } = useCart()
  const { toggle, contains } = useWishlist()

  const [product, setProduct] = useState<Product | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return

    setLoading(true)
    api
      .get(`/api/v1/products/products/${encodeURIComponent(slug)}/`)
      .then((res) => {
        const payload = res.data?.data ?? res.data
        if (payload) {
          setProduct(payload)
          setError('')
        } else {
          setProduct(null)
          setError('Product not found')
        }
      })
      .catch(() => {
        setProduct(null)
        setError('Failed to load product')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const parsedPrice = useMemo(() => (product ? Number(product.price) : 0), [product])
  const selectedVariant = useMemo(
    () => product?.variants?.find((variant) => variant.id === selectedVariantId) ?? null,
    [product, selectedVariantId]
  )
  const activePrice = useMemo(
    () => (selectedVariant?.effective_price ? Number(selectedVariant.effective_price) : parsedPrice),
    [parsedPrice, selectedVariant]
  )
  const availableStock = useMemo(
    () => (selectedVariant ? Number(selectedVariant.available_stock ?? 0) : product ? Number(product.available_stock ?? product.stock ?? 0) : 0),
    [product, selectedVariant]
  )
  const displayImage = useMemo(
    () => selectedVariant?.image || product?.image || null,
    [product, selectedVariant]
  )
  const total = activePrice * quantity
  const wishlisted = product ? contains(product.id) : false

  useEffect(() => {
    if (availableStock <= 0) {
      setQuantity(1)
      return
    }
    setQuantity((prev) => Math.min(prev, availableStock))
  }, [availableStock])

  useEffect(() => {
    if (!product?.variants?.length) {
      setSelectedVariantId(null)
      return
    }

    const preferred = product.variants.find((variant) => Number(variant.available_stock ?? 0) > 0) ?? product.variants[0]
    setSelectedVariantId(preferred.id)
  }, [product])

  const addToCart = async () => {
    if (!product || availableStock <= 0) return
    setAdding(true)
    try {
      await add({
        id: selectedVariant ? `variant-${selectedVariant.id}` : product.id,
        product_id: product.id,
        variant_id: selectedVariant?.id,
        name: selectedVariant?.color_label ? `${product.name} - ${selectedVariant.color_label}` : product.name,
        price: activePrice,
        image: displayImage || '',
        slug: product.slug,
        qty: quantity,
      })
    } finally {
      setAdding(false)
    }
  }

  const toggleWishlist = () => {
    if (!product) return

    toggle({
      id: `wishlist-${product.id}`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: activePrice,
      image: displayImage || product.image || '',
      categoryName: product.category?.name,
      availableStock,
      hasVariants: Boolean(product.variants?.length),
    })
  }

  if (loading) return <DetailSkeleton />

  if (!product) {
    return (
      <div className="py-16 text-center">
        <div className="max-w-[1380px] mx-auto px-6 lg:px-16">
          <h1 className="font-serif text-4xl text-[#2C1810]">Product Not Found</h1>
          <p className="mt-3 text-lg text-[#8A7060]">{error || 'This product is unavailable.'}</p>
          <Link href="/categories" className="btn-primary mt-6 inline-flex px-6">Browse Products</Link>
        </div>
      </div>
    )
  }

  // Extract color options from variants
  const colorOptions = product.variants?.filter(v => v.color).map(v => ({
    id: v.id,
    color: v.color,
    label: v.color_label || v.color,
    available: (v.available_stock ?? 0) > 0,
  })) || [];

  // Size options
  const sizeOptions = ['0-3', '3-6', '6-9', '9-12 months'];

  return (
    <div className="py-8 bg-[#FDF8F3] min-h-screen">
      <div className="max-w-[1380px] mx-auto px-6 lg:px-16">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#8A7060] flex items-center gap-2">
          <Link href="/" className="hover:text-[#8B6914] transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link href="/categories" className="hover:text-[#8B6914] transition-colors">Clothes</Link>
          <ChevronRight size={14} />
          <span className="text-[#2C1810]">Newborn</span>
        </nav>

        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* Product Image */}
          <div className="rounded-3xl bg-[#FAF4EC] p-6 lg:p-10">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
              {displayImage ? (
                <Image 
                  src={displayImage} 
                  alt={product.name} 
                  fill 
                  className="object-cover" 
                  priority 
                  unoptimized={shouldUseUnoptimizedImage(displayImage)} 
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#F5EFE6]">
                  <Package className="w-20 h-20 text-[#C9A96E]" />
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="lg:pt-4">
            {/* Category */}
            <p className="text-sm font-medium text-[#8B6914] uppercase tracking-wide">
              {product.category?.name || 'Product'}
            </p>
            
            {/* Title */}
            <h1 className="font-serif text-3xl lg:text-[2.75rem] font-semibold text-[#2C1810] leading-tight mt-2">
              {product.name}
            </h1>
            
            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <p className="text-3xl font-semibold text-[#2C1810]">
                KES {activePrice.toLocaleString()}
              </p>
              <span className="text-sm text-[#8A7060]">
                {product.variants && product.variants.length > 0 ? selectedVariant?.color_label || 'Select variant' : '0-3 Months'}
              </span>
            </div>

            {/* Rating */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} className="fill-[#C9A96E] text-[#C9A96E]" />
                ))}
              </div>
              <span className="text-xs text-[#8A7060]">(48 reviews)</span>
            </div>

            {/* Color Swatches */}
            {colorOptions.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-[#2C1810] mb-3">Color</p>
                <div className="flex gap-3">
                  {colorOptions.map((colorOpt) => (
                    <button
                      key={colorOpt.id}
                      onClick={() => setSelectedVariantId(colorOpt.id)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedVariantId === colorOpt.id
                          ? 'border-[#8B6914] ring-2 ring-[#8B6914]/20'
                          : 'border-[#E8E0D5] hover:border-[#8B6914]'
                      }`}
                      style={{ backgroundColor: colorOpt.color }}
                      title={colorOpt.label}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[#2C1810]">Size</p>
                <span className="text-xs text-[#8A7060]">{availableStock > 0 ? `${availableStock} in stock` : 'Out of stock'}</span>
              </div>
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-white border border-[#E8E0D5] rounded-xl px-4 py-3 text-sm text-[#2C1810] focus:outline-none focus:border-[#8B6914] cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Size Select</option>
                  {sizeOptions.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[#8A7060] pointer-events-none" />
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <p className="text-sm text-[#5C4033] leading-relaxed">
                {product.description || 'Malaika cotton is Organic cotton Romper I olitier, and sfueck. Nez-production Romper.\n\n• Made with love in Kenya\n• Free yeturn, and lorres enalgiting rotat lorke it compaits\n• Care instructue derlicon chow.'}
              </p>
            </div>

            {/* Add to Cart */}
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={addToCart}
                disabled={availableStock <= 0 || adding}
                className="w-full bg-[#8B6914] hover:bg-[#6B5310] disabled:bg-[#8A7060] text-white font-medium py-4 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBasket size={18} />
                {adding ? 'Adding...' : `Add to Cart - KES ${total.toLocaleString()}`}
              </button>
              
              <button
                type="button"
                onClick={toggleWishlist}
                className="w-full border border-[#E8E0D5] hover:border-[#8B6914] text-[#5C4033] font-medium py-4 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <Heart size={18} className={wishlisted ? 'fill-[#C4704A] text-[#C4704A]' : ''} />
                {wishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.href : '';
                  const text = `Check out ${product.name} on Malaika Nest for KES ${activePrice.toLocaleString()}!`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                }}
                className="w-full bg-[#25D366] hover:bg-[#20BE5A] text-white font-medium py-4 rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm shadow-[#25D366]/20"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Share on WhatsApp
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {TRUST_BADGES.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-xl p-3 border border-[#E8E0D5]">
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-[10px] text-[#5C4033] whitespace-pre-line leading-tight">{badge.label}</span>
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-8 space-y-3 text-sm text-[#8A7060]">
              <p className="flex items-center gap-2">
                <Truck size={16} /> Free delivery on orders over KES 3,000
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck size={16} /> Secure M-Pesa checkout
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 size={16} /> Same-day delivery in Mombasa
              </p>
            </div>
          </div>
        </div>

        {/* You May Also Like */}
        <div className="mt-16 pt-16 border-t border-[#E8E0D5]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-[#2C1810]">
              You May Also Like
            </h2>
            <Link 
              href="/categories" 
              className="flex items-center gap-1 text-sm text-[#8B6914] font-medium hover:gap-2 transition-all"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {MOCK_RELATED_PRODUCTS.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-[#E8E0D5] hover:border-[#8B6914]/30 hover:shadow-warm-md transition-all"
              >
                <div className="aspect-square bg-[#F5EFE6] relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-12 h-12 text-[#C9A96E]" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-[#2C1810] line-clamp-2 group-hover:text-[#8B6914] transition-colors">
                    {item.name}
                  </h3>
                  <p className="mt-2 font-serif font-semibold text-[#8B6914]">
                    KES {item.price}
                  </p>
                  <button className="mt-3 w-full bg-[#8B6914] text-white text-xs font-medium py-2 rounded-full hover:bg-[#6B5310] transition-colors">
                    Add to Cart
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          {product && <ReviewSection productId={product.id} />}
        </div>
      </div>
    </div>
  )
}
