'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingBasket, Heart, Check, Share2, Minus, Plus } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useWishlist } from '@/lib/wishlistContext';
import { showToast } from '@/lib/toast';
import { trackRecentlyViewed } from '@/lib/recently-viewed';

interface DetailProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    image?: string;
    inStock: boolean;
    hasVariants: boolean;
  };
}

/** Interactive image gallery: large preview + clickable thumbnail strip. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const safe = images && images.length ? images.filter(Boolean) : [''];
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3">
      <div
        className="aspect-square rounded-2xl overflow-hidden border"
        style={{ background: 'var(--brand-warm)', borderColor: 'var(--brand-border)' }}
      >
        {safe[active] ? (
          <Image
            src={safe[active]}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            fetchPriority="high"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="font-serif text-8xl opacity-20"
              style={{ color: 'var(--brand-gold)', fontFamily: 'var(--font-cormorant)' }}
            >
              {alt?.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {safe.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safe.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className="w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0 transition-all"
              style={{
                borderColor: i === active ? 'var(--brand-gold)' : 'var(--brand-border)',
                boxShadow: i === active ? '0 0 0 2px var(--brand-gold)' : 'none',
              }}
            >
              {src ? (
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="64px"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full" style={{ background: 'var(--brand-warm)' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetailClient({ product }: DetailProps) {
  const { add } = useCart();
  const { toggle, contains } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    trackRecentlyViewed({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
    });
  }, [product.id, product.name, product.slug, product.price, product.image]);

  const handleAdd = async () => {
    if (!product.inStock || qty < 1) return;
    setAdding(true);
    await add({
      id: `product-${product.id}`,
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image || '',
      qty,
    });
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = () => {
    toggle({
      id: `wishlist-${product.id}`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image || '',
      availableStock: product.inStock ? 1 : 0,
      hasVariants: product.hasVariants,
    });
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard');
      }
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm" style={{ color: product.inStock ? 'var(--brand-green-light)' : 'var(--brand-terra)' }}>
        <span className={`w-2 h-2 rounded-full ${product.inStock ? 'animate-pulse-soft' : ''}`} style={{ background: product.inStock ? 'var(--brand-green-light)' : 'var(--brand-terra)' }} />
        {product.inStock ? 'In stock' : 'Out of stock'}
      </div>

      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: 'var(--brand-text-secondary)' }}>Quantity</span>
        <div className="inline-flex items-center rounded-full border" style={{ borderColor: 'var(--brand-border)' }}>
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="w-10 h-10 inline-flex items-center justify-center rounded-l-full disabled:opacity-40"
            style={{ color: 'var(--brand-brown)' }}
          >
            <Minus size={16} />
          </button>
          <span className="w-10 text-center text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            className="w-10 h-10 inline-flex items-center justify-center rounded-r-full"
            style={{ color: 'var(--brand-brown)' }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.inStock || adding}
          className="flex-1 min-h-[52px] inline-flex items-center justify-center gap-2 rounded-full font-semibold text-sm transition-all disabled:opacity-50"
          style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
        >
          {added ? <><Check size={18} /> Added</> : <><ShoppingBasket size={18} /> {adding ? 'Adding…' : 'Add to Cart'}</>}
        </button>
        <button
          type="button"
          onClick={handleWishlist}
          aria-label="Add to wishlist"
          aria-pressed={contains(product.id)}
          className="w-12 h-[52px] inline-flex items-center justify-center rounded-full border transition-colors"
          style={{ borderColor: 'var(--brand-border)', color: contains(product.id) ? 'var(--brand-terra)' : 'var(--brand-brown)' }}
        >
          <Heart size={18} className={contains(product.id) ? 'fill-current' : ''} />
        </button>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share this product"
          className="w-12 h-[52px] inline-flex items-center justify-center rounded-full border transition-colors"
          style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
        >
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
}
