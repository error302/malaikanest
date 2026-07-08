'use client';

import { useState, useEffect } from 'react';
import { ShoppingBasket, Heart, Check } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useWishlist } from '@/lib/wishlistContext';
import { showToast } from '@/lib/toast';
import { trackRecentlyViewed } from '@/lib/recently-viewed';

interface Props {
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

export function ProductDetailClient({ product }: Props) {
  const { add } = useCart();
  const { toggle, contains } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Track this product view for "Recently Viewed"
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
    if (!product.inStock) return;
    setAdding(true);
    await add({
      id: `product-${product.id}`,
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image || '',
      qty: 1,
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm" style={{ color: product.inStock ? 'var(--brand-green-light)' : 'var(--brand-terra)' }}>
        <span className={`w-2 h-2 rounded-full ${product.inStock ? 'animate-pulse-soft' : ''}`} style={{ background: product.inStock ? 'var(--brand-green-light)' : 'var(--brand-terra)' }} />
        {product.inStock ? 'In stock' : 'Out of stock'}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.inStock || adding || (product.hasVariants && false)}
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
      </div>
    </div>
  );
}
