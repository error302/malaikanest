"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'

import api from '@/lib/api'
import { shouldUseUnoptimizedImage } from '@/lib/media'
import { useCart } from '@/lib/cartContext'
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
}

function DetailSkeleton() {
  return (
    <div className="container-shell py-12">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-[12px] border border-default bg-surface" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-[var(--bg-soft)]" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-[var(--bg-soft)]" />
          <div className="h-8 w-1/2 animate-pulse rounded bg-[var(--bg-soft)]" />
          <div className="h-28 animate-pulse rounded bg-[var(--bg-soft)]" />
        </div>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const { add } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return

    setLoading(true)
    api
      .get(`/api/products/products/?slug=${slug}`)
      .then((res) => {
        const rows = res.data?.results || res.data || []
        if (rows.length > 0) {
          setProduct(rows[0])
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
  const total = parsedPrice * quantity

  const addToCart = async () => {
    if (!product || product.stock <= 0) return
    setAdding(true)
    try {
      await add({
        id: product.id,
        name: product.name,
        price: parsedPrice,
        image: product.image || '',
        slug: product.slug,
        qty: quantity,
      })
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <DetailSkeleton />

  if (!product) {
    return (
      <div className="container-shell py-16 text-center">
        <h1 className="font-display text-[36px] text-[var(--text-primary)]">Product Not Found</h1>
        <p className="mt-3 text-[18px] text-[var(--text-secondary)]">{error || 'This product is unavailable.'}</p>
        <Link href="/categories" className="btn-primary mt-6 inline-flex px-6">Browse Products</Link>
      </div>
    )
  }

  return (
    <div className="py-10">
      <div className="container-shell">
        <nav className="mb-6 text-sm text-[var(--text-secondary)]">
          <Link href="/" className="hover:text-[var(--text-primary)]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/categories" className="hover:text-[var(--text-primary)]">Shop</Link>
          {product.category?.slug && (
            <>
              <span className="mx-2">/</span>
              <Link href={product.category.full_slug ? `/${product.category.full_slug}` : `/categories?category=${product.category.slug}`} className="hover:text-[var(--text-primary)]">
                {product.category.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-[var(--text-primary)]">{product.name}</span>
        </nav>

        <div className="grid items-start gap-10 md:grid-cols-2">
          <div className="rounded-[12px] border border-default bg-surface p-4 shadow-[var(--shadow-soft)]">
            <div className="relative aspect-square overflow-hidden rounded-[12px] bg-[var(--bg-soft)]">
              {product.image ? (
                <Image src={product.image} alt={product.name} fill className="object-cover" priority unoptimized={shouldUseUnoptimizedImage(product.image)} />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)]">
                  <span className="font-display text-7xl text-[var(--text-primary)]">{product.name.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>

          <section className="rounded-[12px] border border-default bg-surface p-6 shadow-[var(--shadow-soft)] md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">{product.category?.name || 'Product'}</p>
            <h1 className="font-display mt-2 text-[40px] text-[var(--text-primary)]">{product.name}</h1>

            <div className="mt-5 flex items-end gap-2">
              <p className="text-3xl font-semibold text-[var(--text-primary)]">KES {parsedPrice.toLocaleString()}</p>
            </div>

            <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">
              {product.stock > 0 ? `In stock (${product.stock} available)` : 'Out of stock'}
            </p>

            <p className="mt-6 whitespace-pre-line text-[16px] text-[var(--text-secondary)]">
              {product.description || 'No description available for this product yet.'}
            </p>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Quantity
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="btn-secondary w-11 px-0"
                  >
                    -
                  </button>
                  <span className="inline-flex h-11 min-w-12 items-center justify-center rounded-[12px] border border-default bg-[var(--bg-primary)] text-[var(--text-primary)]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.min(product.stock || 1, prev + 1))}
                    className="btn-secondary w-11 px-0"
                    disabled={product.stock <= 0}
                  >
                    +
                  </button>
                </div>
              </label>

              <button
                type="button"
                onClick={addToCart}
                disabled={product.stock <= 0 || adding}
                className="btn-primary inline-flex flex-1 items-center justify-center gap-2 px-6"
              >
                <ShoppingBag size={16} />
                {adding ? 'Adding...' : `Add to Cart - KES ${total.toLocaleString()}`}
              </button>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
              <p className="inline-flex items-center gap-2"><Truck size={16} /> Fast delivery options</p>
              <p className="inline-flex items-center gap-2"><ShieldCheck size={16} /> Secure checkout</p>
              <p className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> Quality assurance</p>
              <p className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> Parent-approved picks</p>
            </div>
          </section>
        </div>

        {/* Reviews Section */}
        {product && <ReviewSection productId={product.id} />}
      </div>
    </div>
  )
}

