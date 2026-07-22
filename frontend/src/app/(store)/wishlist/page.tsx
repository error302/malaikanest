'use client';

import Link from 'next/link';
import { Heart, ArrowRight, Trash2, ShoppingBasket } from 'lucide-react';
import { useWishlist } from '@/lib/wishlistContext';
import { getImageUrl } from '@/lib/media';
import { useCart } from '@/lib/cartContext';
import { showToast } from '@/lib/toast';

export default function WishlistPage() {
  const { items, remove, clear } = useWishlist();
  const { add: addToCart } = useCart();

  const handleAddToCart = async (item: typeof items[0]) => {
    addToCart({
      id: item.productId,
      name: item.name,
      slug: item.slug,
      price: item.price,
      image: item.image,
    }, 1);
    showToast('Added to cart!', 'success');
    remove(item.productId);
  };

  if (items.length === 0) {
    return (
      <div className="container-shell py-16 sm:py-24 text-center">
        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--brand-warm)' }}>
          <Heart size={32} style={{ color: 'var(--brand-terra)' }} />
        </div>
        <h1 className="font-serif text-3xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Your wishlist is empty
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--brand-text-secondary)' }}>
          Save your favourite items here for later. Tap the heart on any product to add it.
        </p>
        <Link href="/categories" className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          Browse Products <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-shell py-6 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          My Wishlist ({items.length})
        </h1>
        <button type="button" onClick={clear} className="text-xs underline" style={{ color: 'var(--brand-text-muted)' }}>
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <div className="relative aspect-[4/5]">
              {item.image ? (
                <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--brand-warm)' }}>
                  <span className="font-serif text-5xl opacity-30" style={{ color: 'var(--brand-gold)' }}>{item.name.charAt(0)}</span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  remove(item.productId);
                }}
                aria-label="Remove from wishlist"
                className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--brand-terra)' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-3 sm:p-4">
              <Link href={`/products/${item.slug}`}>
                <h3 className="text-sm font-semibold line-clamp-2 mb-1" style={{ color: 'var(--brand-text)' }}>{item.name}</h3>
              </Link>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--brand-gold)' }}>
                KES {item.price.toLocaleString('en-KE')}
              </p>
              <button
                type="button"
                onClick={() => handleAddToCart(item)}
                className="w-full flex items-center justify-center gap-2 rounded-full min-h-[44px] text-sm font-medium"
                style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
              >
                <ShoppingBasket size={16} />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}