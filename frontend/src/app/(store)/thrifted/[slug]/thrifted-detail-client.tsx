'use client';

import { useState } from 'react';
import { ShoppingBasket, Heart, Check } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useWishlist } from '@/lib/wishlistContext';
import { showToast } from '@/lib/toast';
import type { ThriftedProduct } from '@/lib/thrifted';

interface Props {
  product: ThriftedProduct;
}

export function ThriftedDetailClient({ product }: Props) {
  const { add } = useCart();
  const { toggle, contains } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    if (!product.isAvailable) return;
    setAdding(true);
    await add({
      id: `thrifted-${product.id}`,
      product_id: undefined,
      name: `${product.name} (Mtumba)`,
      slug: product.slug,
      price: product.price,
      image: product.image,
      qty: 1,
    });
    setAdding(false);
    setAdded(true);
    showToast('Thrifted item added to cart', 'success');
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = () => {
    toggle({
      id: `wishlist-thrifted-${product.id}`,
      productId: parseInt(product.id.replace(/\D/g, '').slice(0, 8)) || 0,
      name: `${product.name} (Mtumba)`,
      slug: product.slug,
      price: product.price,
      image: product.image,
      availableStock: product.isAvailable ? 1 : 0,
      hasVariants: false,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm" style={{ color: product.isAvailable ? 'var(--brand-green-light)' : 'var(--brand-terra)' }}>
        <span className={`w-2 h-2 rounded-full ${product.isAvailable ? 'animate-pulse-soft' : ''}`} style={{ background: product.isAvailable ? 'var(--brand-green-light)' : 'var(--brand-terra)' }} />
        {product.isAvailable ? 'Available — one only!' : 'Sold out'}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.isAvailable || adding}
          className="flex-1 min-h-[52px] inline-flex items-center justify-center gap-2 rounded-full font-semibold text-sm transition-all disabled:opacity-50"
          style={{ background: 'var(--brand-terra)', color: '#FFFFFF' }}
        >
          {added ? <><Check size={18} /> Added</> : <><ShoppingBasket size={18} /> {adding ? 'Adding…' : 'Add to Cart'}</>}
        </button>
        <button
          type="button"
          onClick={handleWishlist}
          aria-label="Add to wishlist"
          aria-pressed={contains(parseInt(product.id.replace(/\D/g, '').slice(0, 8)) || 0)}
          className="w-12 h-[52px] inline-flex items-center justify-center rounded-full border transition-colors"
          style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
        >
          <Heart size={18} />
        </button>
      </div>
    </div>
  );
}
