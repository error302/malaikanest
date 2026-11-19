'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ShoppingBasket, Heart, Check, Share2, Minus, Plus, MessageCircle } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useCartDrawer } from '@/lib/cartDrawerStore';
import { useWishlist } from '@/lib/wishlistContext';
import { showToast } from '@/lib/toast';
import { trackRecentlyViewed } from '@/lib/recently-viewed';
import { SizeGuideModal } from '@/components/malaika/size-guide-modal';
import { ProductTrustBadges } from '@/components/malaika/product-detail/ProductTrustBadges';
import { ProductSafetyAccordions } from '@/components/malaika/product-detail/ProductSafetyAccordions';
import { ProductStickyCTA } from '@/components/malaika/product-detail/ProductStickyCTA';
import { ProductVariantsSelector } from '@/components/malaika/product-detail/ProductVariantsSelector';

interface DetailProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    image?: string;
    inStock: boolean;
    hasVariants: boolean;
    variants?: Array<{
      id: number;
      size?: string;
      size_label?: string;
      color?: string;
      color_label?: string;
      price_modifier: string;
      stock: number;
    }>;
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
                  alt={`${alt || 'Product'} thumbnail ${i + 1}`}
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
  const { toggle } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement | null>(null);

  const variants = product.variants || [];
  const activeVariant = variants.find((v) => v.id === selectedVariant) || null;
  const currentPrice = product.price + parseFloat(activeVariant?.price_modifier || '0');
  const isOutOfStock = product.hasVariants
    ? (activeVariant ? activeVariant.stock <= 0 : true)
    : !product.inStock;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://malaikanest.com/products/${product.slug}`;
  const variantLabel = activeVariant ? [activeVariant.size_label, activeVariant.color_label].filter(Boolean).join(' / ') : '';
  const waMsg = `Hi Malaika Nest! I would like to order: *${product.name}* (KES ${currentPrice.toLocaleString('en-KE')})${variantLabel ? ` [Option: ${variantLabel}]` : ''} × ${qty}.\nLink: ${currentUrl}`;
  const whatsAppOrderUrl = `https://wa.me/254726771321?text=${encodeURIComponent(waMsg)}`;

  useEffect(() => {
    if (product.hasVariants && variants.length > 0 && !selectedVariant) {
      const firstInStock = variants.find((v) => v.stock > 0) || variants[0];
      setSelectedVariant(firstInStock.id);
    }
  }, [product.hasVariants, variants, selectedVariant]);

  useEffect(() => {
    const el = addBtnRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setShowSticky(!entry.isIntersecting);
      },
      { root: null, rootMargin: '0px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('malaika_wishlist_v1');
      const items: Array<{ productId: number | string }> = JSON.parse(raw || '[]');
      setIsWishlisted(items.some((item) => String(item.productId) === String(product.id)));
    } catch { }
  }, [product.id]);

  useEffect(() => {
    trackRecentlyViewed({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: currentPrice,
      image: product.image,
    });
  }, [product.id, product.name, product.slug, currentPrice, product.image]);

  const handleAdd = async () => {
    if (isOutOfStock || qty < 1) return;
    if (product.hasVariants && !selectedVariant) {
      showToast('Please select an option');
      return;
    }

    setAdding(true);
    await add({
      id: selectedVariant ? `variant-${selectedVariant}` : `product-${product.id}`,
      product_id: product.id,
      variant_id: selectedVariant || undefined,
      name: product.name,
      slug: product.slug,
      price: currentPrice,
      image: product.image || '',
      qty,
      variant_label: activeVariant
        ? [activeVariant.size_label, activeVariant.color_label].filter(Boolean).join(' / ')
        : undefined,
    });
    setAdding(false);
    setAdded(true);
    useCartDrawer.getState().openDrawer();
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = () => {
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
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
    showToast(nextState ? 'Saved to your wishlist' : 'Removed from wishlist', 'info');
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
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm" style={{ color: !isOutOfStock ? 'var(--brand-green-light)' : 'var(--brand-terra)' }}>
        <span className={`w-2 h-2 rounded-full ${!isOutOfStock ? 'animate-pulse-soft' : ''}`} style={{ background: !isOutOfStock ? 'var(--brand-green-light)' : 'var(--brand-terra)' }} />
        {!isOutOfStock ? 'In stock' : 'Out of stock'}
      </div>

      <ProductVariantsSelector
        hasVariants={product.hasVariants}
        variants={variants}
        selectedVariant={selectedVariant}
        onSelectVariant={setSelectedVariant}
        onOpenSizeGuide={() => setShowSizeGuide(true)}
      />

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

      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            ref={addBtnRef}
            type="button"
            onClick={handleAdd}
            disabled={isOutOfStock || adding}
            data-pdp-cta
            className="flex-1 min-h-[52px] inline-flex items-center justify-center gap-2 rounded-full font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
          >
            {added ? <><Check size={18} /> Added to Cart</> : <><ShoppingBasket size={18} /> {adding ? 'Adding…' : 'Add to Cart'}</>}
          </button>
          <button
            type="button"
            onClick={handleWishlist}
            aria-label="Add to wishlist"
            aria-pressed={isWishlisted}
            className="w-12 h-[52px] inline-flex items-center justify-center rounded-full border transition-colors"
            style={{ borderColor: 'var(--brand-border)', color: isWishlisted ? 'var(--brand-terra)' : 'var(--brand-brown)' }}
          >
            <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
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

        <a
          href={whatsAppOrderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full font-semibold text-sm transition-all border hover:shadow-warm-sm"
          style={{
            borderColor: '#25D366',
            color: '#128C7E',
            background: 'rgba(37, 211, 102, 0.08)',
          }}
        >
          <MessageCircle size={18} style={{ color: '#25D366' }} /> Order Directly via WhatsApp (+254 726 771 321)
        </a>
      </div>

      <ProductTrustBadges />

      <ProductSafetyAccordions />

      <ProductStickyCTA
        showSticky={showSticky}
        productName={product.name}
        currentPrice={currentPrice}
        isOutOfStock={isOutOfStock}
        adding={adding}
        added={added}
        onAdd={handleAdd}
      />

      <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
    </div>
  );
}
