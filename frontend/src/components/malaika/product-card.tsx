'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Star, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cartContext';
import { showToast } from '@/lib/toast';
import { shouldUseUnoptimizedImage } from '@/lib/media';

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
  variantCount?: number;
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
  const { t } = useI18n();
  const { add: addToCart } = useCart();
  const [wished, setWished] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imageErrored, setImageErrored] = useState(false);

  const inStock = product.inStock !== false;
  const discount = product.originalPrice
    ? parseFloat(((product.originalPrice - product.price) / product.originalPrice * 100).toFixed(1))
    : 0;
  const gradient = PLACEHOLDER_GRADIENTS[product.id % PLACEHOLDER_GRADIENTS.length];

  const handleAdd = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!inStock) return;
    if ((product.variantCount ?? 0) > 1) {
      window.location.href = `/products/${product.slug}`;
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
    }, 1);
    showToast(t('product.addedToCart') || 'Added to cart', 'success');
  };

  return (
    <article
      className="group relative flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHovered(false);
      }}
    >
      {/* Image — sharp corners, no border, no shadow, portrait aspect */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block w-full overflow-hidden aspect-[3/4]"
        style={{ background: gradient }}
        aria-label={`View ${product.name}`}
      >
        {product.image && !imageErrored ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={index < 4}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImageErrored(true)}
            unoptimized={shouldUseUnoptimizedImage(product.image)}
            className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="font-serif text-5xl opacity-40"
              style={{ color: 'var(--brand-gold)', fontFamily: 'var(--font-cormorant)' }}
            >
              {product.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Subtle scrim only when image needs text protection — kept minimal */}
        {!inStock && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.55)' }}
          >
            <span
              className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: 'var(--brand-brown-dark)', letterSpacing: '0.14em' }}
            >
              {t('product.outOfStock')}
            </span>
          </div>
        )}
      </Link>

      {/* Wishlist — minimal overlay, only on hover (desktop) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setWished((w) => !w);
        }}
        aria-label={wished ? t('product.removeWishlist') : t('product.wishlist')}
        aria-pressed={wished}
        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
          hovered || wished ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        } sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:scale-100`}
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Heart
          size={16}
          strokeWidth={1.75}
          className={wished ? 'fill-current' : ''}
          style={{ color: wished ? 'var(--brand-terra)' : 'var(--brand-brown)' }}
        />
      </button>

      {/* Badges — moved off image to the meta row below (editorial) */}
      {(product.badge || discount > 0) && (
        <div className="flex items-center gap-1.5 mt-3">
          {product.badge && (
            <span
              className="inline-flex items-center text-[10px] font-medium uppercase tracking-[0.12em] px-2 py-0.5"
              style={{
                background: 'var(--brand-warm)',
                color: 'var(--brand-brown)',
              }}
            >
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span
              className="inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5"
              style={{
                background: 'var(--brand-terra)',
                color: '#FFFFFF',
              }}
            >
              −{discount}%
            </span>
          )}
        </div>
      )}

      {/* Meta row — minimal, breathing space */}
      <div className="flex flex-col flex-1 mt-2.5">
        {product.category && (
          <div
            className="hidden sm:block text-[10px] uppercase tracking-[0.14em] font-medium mb-1"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            {product.category}
          </div>
        )}

        <Link
          href={`/products/${product.slug}`}
          className="group/link"
          aria-label={`View ${product.name.charAt(0).toUpperCase() + product.name.slice(1)}`}
        >
          <h3
            className="text-[13px] sm:text-[14px] font-medium leading-snug line-clamp-2 min-h-[2.5rem] transition-colors"
            style={{ color: 'var(--brand-text)' }}
          >
            {product.name}
          </h3>
        </Link>

        {product.rating !== undefined && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Star
              size={11}
              className="fill-current"
              style={{ color: 'var(--brand-gold)' }}
            />
            <span
              className="text-[11px] font-semibold"
              style={{ color: 'var(--brand-text)' }}
            >
              {product.rating.toFixed(1)}
            </span>
            {product.reviewCount !== undefined && (
              <span
                className="text-[11px]"
                style={{ color: 'var(--brand-text-muted)' }}
              >
                · {product.reviewCount} review{product.reviewCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-2 mt-2">
          <span
            className="text-[14px] sm:text-[15px] font-bold"
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

        {/* Add action — understated, not a giant CTA bar */}
        <div className="mt-3">
          {/* Mobile: rounded pill button with icon */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className="sm:hidden inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 active:scale-95 disabled:opacity-40"
            style={{
              background: 'var(--brand-warm)',
              color: 'var(--brand-brown-dark)',
              border: '1px solid var(--brand-border)',
            }}
            aria-label={`${t('product.addToCart')} ${product.name}`}
          >
            <Plus size={13} strokeWidth={2.2} />
            {inStock
              ? (product.variantCount ?? 0) > 1
                ? t('product.viewDetails')
                : t('product.addToCart')
              : t('product.outOfStock')}
          </button>

          {/* Desktop hover: subtle bordered slide-up bar */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className={`hidden sm:inline-flex items-center justify-center gap-1.5 w-full py-2.5 mt-1 text-[12px] font-medium uppercase tracking-[0.1em] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
              hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
            }`}
            style={{
              background: 'var(--brand-brown)',
              color: '#FFFFFF',
            }}
            aria-label={`${t('product.addToCart')} ${product.name}`}
          >
            <ShoppingBag size={13} strokeWidth={1.75} />
            {inStock
              ? (product.variantCount ?? 0) > 1
                ? t('product.viewDetails')
                : t('product.addToCart')
              : t('product.outOfStock')}
          </button>
        </div>
      </div>
    </article>
  );
}
