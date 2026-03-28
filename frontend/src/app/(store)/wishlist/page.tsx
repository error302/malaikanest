"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'

import { useWishlist } from '@/lib/wishlistContext'
import { useCart } from '@/lib/cartContext'
import { getImageUrl, shouldUseUnoptimizedImage } from '@/lib/media'

export default function WishlistPage() {
  const { items, remove, clear } = useWishlist()
  const { add } = useCart()

  const moveToCart = async (item: (typeof items)[number]) => {
    await add({
      id: item.productId,
      product_id: item.productId,
      name: item.name,
      price: item.price,
      image: item.image || '',
      slug: item.slug,
      qty: 1,
    })
  }

  return (
    <div className="container-shell py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Saved for later
          </p>
          <h1 className="font-display mt-2 text-[36px] text-[var(--text-primary)]">Wishlist</h1>
          <p className="mt-2 text-[16px] text-[var(--text-secondary)]">
            {items.length > 0
              ? `${items.length} item${items.length === 1 ? '' : 's'} you’ve hearted`
              : 'Your saved favourites will appear here.'}
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-default px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-soft)]"
          >
            <Trash2 size={16} />
            Clear wishlist
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-[18px] border border-default bg-surface px-6 py-14 text-center shadow-[var(--shadow-soft)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-soft)] text-[var(--text-primary)]">
            <Heart size={28} />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-[var(--text-primary)]">Your wishlist is empty</h2>
          <p className="mx-auto mt-2 max-w-xl text-[16px] text-[var(--text-secondary)]">
            Tap the heart on any product you love and it will show up here for quick access later.
          </p>
          <Link href="/categories" className="btn-primary mt-6 inline-flex rounded-full px-6 py-3">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const imageUrl = getImageUrl(item.image || null)

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-[18px] border border-default bg-surface shadow-[var(--shadow-soft)]"
              >
                <Link href={`/products/${item.slug}`} className="block">
                  <div className="relative aspect-[4/3] bg-[var(--bg-soft)]">
                    {imageUrl && imageUrl !== '/placeholder.svg' ? (
                      <Image
                        src={imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized={shouldUseUnoptimizedImage(imageUrl)}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[var(--bg-soft)]">
                        <span className="font-display text-5xl text-[var(--text-primary)]">
                          {item.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                    {item.categoryName || 'Product'}
                  </p>
                  <Link href={`/products/${item.slug}`} className="mt-2 block">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] transition hover:text-[var(--link-hover)]">
                      {item.name}
                    </h2>
                  </Link>
                  <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
                    KES {Number(item.price).toLocaleString('en-KE')}
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => moveToCart(item)}
                      className="btn-primary inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold"
                    >
                      <ShoppingBag size={16} />
                      Add to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.productId)}
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-default px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-soft)]"
                    >
                      <Heart size={16} className="fill-current" />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
