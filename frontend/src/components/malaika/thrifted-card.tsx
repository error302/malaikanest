'use client';

import Link from 'next/link';
import { Heart, ShoppingBasket, Sparkles, Tag } from 'lucide-react';
import { useState } from 'react';
import { CONDITION_LABELS, type ThriftedProduct } from '@/lib/thrifted';
import { useWishlist } from '@/lib/wishlistContext';

const CONDITION_COLORS: Record<string, string> = {
  like_new: 'var(--brand-green-light)',
  good: 'var(--brand-gold)',
  fair: 'var(--brand-terra)',
};

export function ThriftedCard({ product, index = 0 }: { product: ThriftedProduct; index?: number }) {
  const { contains, toggle: toggleWishlist } = useWishlist();
  const wished = contains(product.id);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <article
      className="group flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-1 relative"
      style={{
        background: '#FFFFFF',
        borderColor: 'var(--brand-border)',
      }}
    >
      {/* Mtumba badge */}
      <div
        className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
        style={{ background: 'var(--brand-terra)', color: '#FFFFFF' }}
      >
        <Sparkles size={10} /> Mtumba
      </div>

      {/* Discount badge */}
      {discount > 0 && (
        <div
          className="absolute top-3 right-12 z-10 text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
        >
          -{discount}%
        </div>
      )}

      {/* Wishlist */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist({
            id: String(product.id),
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.image,
            categoryName: 'Thrifted',
          });
        }}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wished}
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-warm-sm transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]"
        style={{ background: 'rgba(255,255,255,0.95)' }}
      >
        <Heart
          size={16}
          strokeWidth={1.75}
          className={wished ? 'fill-current' : ''}
          style={{ color: wished ? 'var(--brand-terra)' : 'var(--brand-brown)' }}
        />
      </button>

      {/* Image */}
      <Link href={`/thrifted/${product.slug}`} className="relative aspect-[4/5] w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]" style={{ background: 'var(--brand-warm)' }}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading={index < 4 ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Tag size={32} style={{ color: 'var(--brand-gold)' }} />
          </div>
        )}

        {/* Condition badge */}
        <div
          className="absolute bottom-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: `${CONDITION_COLORS[product.condition] || 'var(--brand-gold)'}20`,
            color: CONDITION_COLORS[product.condition] || 'var(--brand-gold)',
          }}
        >
          {CONDITION_LABELS[product.condition] || product.condition}
        </div>

        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.6)' }}>
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded" style={{ background: 'var(--brand-brown-dark)', color: '#FFFFFF' }}>
              Sold
            </span>
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {product.brand && (
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--brand-text-muted)' }}>
            {product.brand}
          </div>
        )}

        <Link href={`/thrifted/${product.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] rounded-sm">
          <h3 className="text-[13px] sm:text-[14px] font-semibold leading-snug line-clamp-2 min-h-[2.5rem]" style={{ color: 'var(--brand-text)' }}>
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mt-1.5 text-[11px]" style={{ color: 'var(--brand-text-muted)' }}>
          {product.size && <span>Size: {product.size}</span>}
          {product.size && product.gender && <span>·</span>}
          {product.gender && <span className="capitalize">{product.gender}</span>}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[14px] sm:text-[15px] font-semibold" style={{ color: 'var(--brand-text)' }}>
            KES {product.price.toLocaleString('en-KE')}
          </span>
          {product.originalPrice && (
            <span className="text-[12px] line-through" style={{ color: 'var(--brand-text-muted)' }}>
              KES {product.originalPrice.toLocaleString('en-KE')}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!product.isAvailable}
          className="mt-3 min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[13px] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]"
          style={{ background: 'var(--brand-terra)', color: '#FFFFFF' }}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingBasket size={15} />
          {product.isAvailable ? 'Add to Cart' : 'Sold Out'}
        </button>
      </div>
    </article>
  );
}
