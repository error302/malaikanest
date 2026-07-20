'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBasket, Star, X } from 'lucide-react';

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  inStock?: boolean;
  hasVariants?: boolean;
}

function formatKES(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

const PLACEHOLDER_GRADIENTS = [
  'linear-gradient(135deg, #F5EFE6 0%, #E8D5B5 100%)',
  'linear-gradient(135deg, #FCE7E1 0%, #F8D5C9 100%)',
  'linear-gradient(135deg, #E1EEF8 0%, #C5DCF0 100%)',
  'linear-gradient(135deg, #E1F4E8 0%, #BFE6CC 100%)',
  'linear-gradient(135deg, #EFE3F8 0%, #D8C2EE 100%)',
  'linear-gradient(135deg, #FEF3DC 0%, #F8E5B8 100%)',
];

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [wished, setWished] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [hovered, setHovered] = useState(false);

  const inStock = product.inStock !== false;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const gradient = PLACEHOLDER_GRADIENTS[product.id % PLACEHOLDER_GRADIENTS.length];

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    // cart hook integration would go here
  };

  return (
    <>
      <article
        className="group flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-1"
        style={{
          background: '#FFFFFF',
          borderColor: 'var(--brand-border)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <div
          className="relative aspect-[4/5] w-full overflow-hidden cursor-pointer"
          style={{ background: gradient }}
          onClick={() => setZoom(true)}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading={index < 4 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span
                className="font-serif text-5xl opacity-30"
                style={{ color: 'var(--brand-gold)', fontFamily: 'var(--font-cormorant)' }}
              >
                {product.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.badge && (
              <span
                className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{
                  background: 'var(--brand-terra)',
                  color: '#FFFFFF',
                }}
              >
                {product.badge}
              </span>
            )}
            {discount > 0 && (
              <span
                className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{
                  background: 'var(--brand-gold)',
                  color: '#FFFFFF',
                }}
              >
                -{discount}%
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWished((w) => !w);
            }}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wished}
            className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-warm-sm transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.95)' }}
          >
            <Heart
              size={18}
              strokeWidth={1.75}
              className={wished ? 'fill-current' : ''}
              style={{ color: wished ? 'var(--brand-terra)' : 'var(--brand-brown)' }}
            />
          </button>

          {/* Quick add (desktop hover) */}
          <div
            className={`absolute bottom-3 left-3 right-3 transition-all duration-300 ${
              hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock}
              className="w-full py-2.5 rounded-full font-semibold text-[13px] shadow-warm-md backdrop-blur-sm transition-colors disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.95)',
                color: 'var(--brand-text)',
              }}
            >
              {product.hasVariants ? 'View Options' : inStock ? 'Quick Add' : 'Sold Out'}
            </button>
          </div>

          {!inStock && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.55)' }}
            >
              <span
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded"
                style={{ background: 'var(--brand-brown-dark)', color: '#FFFFFF' }}
              >
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          {product.category && (
            <div
              className="text-[10px] uppercase tracking-wider font-medium mb-1"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              {product.category}
            </div>
          )}

          <Link
            href="#"
            className="group/link"
            aria-label={`View ${product.name}`}
          >
            <h3
              className="text-[13px] sm:text-[14px] font-semibold leading-snug line-clamp-2 min-h-[2.5rem] transition-colors"
              style={{ color: 'var(--brand-text)' }}
            >
              {product.name}
            </h3>
          </Link>

          {product.rating !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star
                size={12}
                className="fill-current"
                style={{ color: 'var(--brand-gold)' }}
              />
              <span
                className="text-[11px] font-medium"
                style={{ color: 'var(--brand-brown)' }}
              >
                {product.rating.toFixed(1)}
              </span>
              {product.reviewCount !== undefined && (
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="text-[14px] sm:text-[15px] font-semibold"
              style={{ color: 'var(--brand-text)' }}
            >
              {formatKES(product.price)}
            </span>
            {product.originalPrice && (
              <span
                className="text-[12px] line-through"
                style={{ color: 'var(--brand-text-muted)' }}
              >
                {formatKES(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Mobile add button (always visible) */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className="sm:hidden mt-3 min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[13px] transition-colors disabled:opacity-50"
            style={{
              background: 'var(--brand-brown-dark)',
              color: '#FFFFFF',
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBasket size={15} />
            {product.hasVariants ? 'Choose' : inStock ? 'Add' : 'Sold Out'}
          </button>
        </div>
      </article>

      {/* Image zoom */}
      {zoom && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} image preview`}
        >
          <button
            type="button"
            className="absolute top-6 right-6 w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }}
            aria-label="Close preview"
          >
            <X size={22} />
          </button>
          <div
            className="relative w-full max-w-2xl aspect-square rounded-2xl overflow-hidden"
            style={{ background: gradient }}
            onClick={(e) => e.stopPropagation()}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span
                  className="font-serif text-8xl opacity-30"
                  style={{ color: 'var(--brand-gold)', fontFamily: 'var(--font-cormorant)' }}
                >
                  {product.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <p
            className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-base font-medium text-center px-4"
          >
            {product.name}
          </p>
        </div>
      )}
    </>
  );
}
