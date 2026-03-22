'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Star, ArrowRight, Eye, Package, Truck, Shield, CreditCard, Gift, Shirt, Home, Gamepad2, Car, Sparkles } from 'lucide-react';
import { getImageUrl } from '@/lib/media';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  original_price?: string;
  image: string | null;
  category?: { name?: string; full_slug?: string };
  rating?: number;
  review_count?: number;
  featured?: boolean;
  stock?: number;
  badge?: string;
  badge_color?: string;
}

function priceKES(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`;
}

function discount(price: number, original: number) {
  return Math.round(((original - price) / original) * 100);
}

function ProductCard({ product }: { product: Product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const imageUrl = product.image ? getImageUrl(product.image) : null;
  const categoryName = product.category?.name ?? 'Products';
  const rating = product.rating ?? 4;
  const reviewCount = product.review_count ?? 0;
  const price = Number(product.price) || 0;
  const originalPrice = product.original_price ? Number(product.original_price) : null;
  const inStock = (product.stock ?? 0) > 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-[#EDE3D8] hover:border-[#C9A96E]/50 hover:shadow-xl transition-all duration-300"
    >
      <div className="relative bg-[#F5EFE6] aspect-square overflow-hidden">
        {!imageError && imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#F5EFE6]">
            <Package className="w-12 h-12 text-[#C9A96E]" />
          </div>
        )}

        {product.badge && (
          <div className={`absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            product.badge_color ?? 'bg-[#1A3A2A] text-[#E8C98A]'
          }`}>
            {product.badge}
          </div>
        )}

        {originalPrice && originalPrice > price && (
          <div className="absolute top-3 right-3 bg-[#C4704A] text-white text-[10px] font-bold px-2 py-1 rounded-full">
            -{discount(price, originalPrice)}%
          </div>
        )}

        <div className="absolute inset-0 flex items-end justify-center gap-2 pb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              setWishlisted((w) => !w);
            }}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#FFF5F0] transition-colors"
            aria-label="Add to wishlist"
          >
            <Heart
              size={15}
              className={wishlisted ? 'fill-[#C4704A] text-[#C4704A]' : 'text-[#5C4033]'}
            />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!inStock) return;
              setAddedToCart(true);
              setTimeout(() => setAddedToCart(false), 1800);
            }}
            className={`flex-1 mx-2 max-w-[140px] h-9 rounded-full text-xs font-medium shadow-md flex items-center justify-center gap-1.5 transition-all ${
              addedToCart
                ? 'bg-[#1A3A2A] text-[#E8C98A]'
                : inStock ? 'bg-white text-[#1A3A2A] hover:bg-[#1A3A2A] hover:text-[#E8C98A]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!inStock}
          >
            <ShoppingBag size={13} />
            {addedToCart ? 'Added!' : inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
          <Link
            href={`/products/${product.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#F5EFE6] transition-colors"
            aria-label="Quick view"
          >
            <Eye size={15} className="text-[#5C4033]" />
          </Link>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] uppercase tracking-[0.1em] text-[#8A7060] mb-1">
          {categoryName}
        </p>
        <h3 className="text-sm font-medium text-[#2C1810] leading-snug mb-2 line-clamp-2 group-hover:text-[#1A3A2A] transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={11}
              className={
                i < Math.round(rating)
                  ? 'fill-[#C9A96E] text-[#C9A96E]'
                  : 'text-[#D8CFC5]'
              }
            />
          ))}
          <span className="text-[10px] text-[#8A7060] ml-1">({reviewCount})</span>
        </div>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-serif text-lg font-semibold text-[#1A3A2A]">
            {priceKES(price)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-[#8A7060] line-through">
              {priceKES(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function FeaturedCard({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const imageUrl = product.image ? getImageUrl(product.image) : null;
  const categoryName = product.category?.name ?? 'Products';
  const price = Number(product.price) || 0;
  const originalPrice = product.original_price ? Number(product.original_price) : null;

  return (
    <div className="group relative rounded-3xl overflow-hidden bg-[#F5EFE6] flex flex-col justify-end min-h-[480px] lg:min-h-[560px]">
      {!imageError && imageUrl ? (
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-103"
          sizes="(max-width:1024px) 100vw, 50vw"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F5EFE6]">
          <Sparkles className="w-20 h-20 text-[#C9A96E]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {product.badge && (
        <div className="absolute top-5 left-5 bg-[#C4704A] text-white text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
          {product.badge}
        </div>
      )}

      <div className="relative z-10 p-6 lg:p-8">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-1">{categoryName}</p>
        <h3 className="text-white font-serif text-2xl lg:text-3xl font-semibold leading-tight mb-1">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-[#E8C98A] font-serif text-2xl font-semibold">
            {priceKES(price)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-white/50 text-sm line-through">
              {priceKES(originalPrice)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setAddedToCart(true);
              setTimeout(() => setAddedToCart(false), 1800);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
              addedToCart
                ? 'bg-[#1A3A2A] text-[#E8C98A]'
                : 'bg-white text-[#1A3A2A] hover:bg-[#C4704A] hover:text-white'
            }`}
          >
            <ShoppingBag size={14} />
            {addedToCart ? 'Added!' : 'Add to Cart'}
          </button>
          <Link
            href={`/products/${product.slug}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-light border border-white/30 text-white hover:bg-white/10 transition-all"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { name: 'Clothing', href: '/categories', Icon: Shirt, color: 'bg-rose-50 hover:bg-rose-100' },
  { name: 'Essentials', href: '/categories', Icon: Package, color: 'bg-amber-50 hover:bg-amber-100' },
  { name: 'Nursery', href: '/categories', Icon: Home, color: 'bg-sky-50 hover:bg-sky-100' },
  { name: 'Toys', href: '/categories', Icon: Gamepad2, color: 'bg-violet-50 hover:bg-violet-100' },
  { name: 'Travel', href: '/categories', Icon: Car, color: 'bg-green-50 hover:bg-green-100' },
  { name: 'Gifts', href: '/categories', Icon: Gift, color: 'bg-pink-50 hover:bg-pink-100' },
];

export function CategoryQuickLinks() {
  return (
    <section className="bg-[#FAF4EC] py-10 px-6 lg:px-16">
      <div className="max-w-[1380px] mx-auto">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORIES.map(({ name, href, Icon, color }) => (
            <Link
              key={name}
              href={href}
              className={`${color} rounded-2xl py-5 flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border border-transparent hover:border-[#C9A96E]/20`}
            >
              <Icon className="w-7 h-7 text-[#1A3A2A]" />
              <span className="text-xs font-medium text-[#2C1810]">{name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

interface ProductSectionProps {
  title: string;
  label?: string;
  viewAllHref: string;
  products: Product[];
  layout?: 'grid4' | 'featured+3' | 'grid3';
}

export function ProductSection({
  title,
  label,
  viewAllHref,
  products,
  layout = 'grid4',
}: ProductSectionProps) {
  if (!products || products.length === 0) return null;

  if (layout === 'featured+3' && products.length >= 4) {
    return (
      <section className="py-14 px-6 lg:px-16 bg-[#FDF8F3]">
        <div className="max-w-[1380px] mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              {label && (
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#C4704A] font-medium mb-1.5">
                  <span className="block w-5 h-px bg-[#C4704A]" />
                  {label}
                </p>
              )}
              <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-[#1A3A2A]">
                {title}
              </h2>
            </div>
            <Link
              href={viewAllHref}
              className="hidden sm:flex items-center gap-1.5 text-sm text-[#C4704A] font-medium hover:gap-2.5 transition-all"
            >
              View all <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <FeaturedCard product={products[0]} />
            <div className="flex flex-col gap-5">
              {products.slice(1, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group flex gap-4 bg-white rounded-2xl p-4 border border-[#EDE3D8] hover:border-[#C9A96E]/40 hover:shadow-lg transition-all"
                >
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-[#F5EFE6]">
                    {p.image && (
                      <Image
                        src={getImageUrl(p.image)}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="96px"
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-[#8A7060] mb-0.5">
                      {p.category?.name ?? 'Products'}
                    </p>
                    <h3 className="text-sm font-medium text-[#2C1810] line-clamp-2 leading-snug mb-1 group-hover:text-[#1A3A2A]">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base font-semibold text-[#1A3A2A]">
                        KES {Number(p.price).toLocaleString('en-KE')}
                      </span>
                      {p.original_price && Number(p.original_price) > Number(p.price) && (
                        <span className="text-xs text-[#8A7060] line-through">
                          KES {Number(p.original_price).toLocaleString('en-KE')}
                        </span>
                      )}
                    </div>
                    {p.badge && (
                      <span className="mt-1.5 self-start text-[10px] bg-[#FFF5F0] text-[#C4704A] px-2 py-0.5 rounded-full font-medium">
                        {p.badge}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 px-6 lg:px-16 bg-[#FDF8F3]">
      <div className="max-w-[1380px] mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            {label && (
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#C4704A] font-medium mb-1.5">
                <span className="block w-5 h-px bg-[#C4704A]" />
                {label}
              </p>
            )}
            <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-[#1A3A2A]">
              {title}
            </h2>
          </div>
          <Link
            href={viewAllHref}
            className="hidden sm:flex items-center gap-1.5 text-sm text-[#C4704A] font-medium hover:gap-2.5 transition-all"
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>

        <div className={`grid gap-4 lg:gap-5 ${
          layout === 'grid3' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {products.slice(0, layout === 'grid3' ? 3 : 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <Link
          href={viewAllHref}
          className="sm:hidden mt-6 flex items-center justify-center gap-2 w-full py-3 border border-[#C9A96E]/30 rounded-full text-sm text-[#1A3A2A] font-medium hover:bg-[#F5EFE6] transition-colors"
        >
          View all <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

const VALUE_PROPS = [
  { Icon: Shield, title: 'Safety Tested', body: 'Every item meets international child safety standards. We only stock what we use ourselves.' },
  { Icon: CreditCard, title: 'M-Pesa Checkout', body: 'Instant STK Push to your phone. No card needed.' },
  { Icon: Truck, title: 'Fast Delivery', body: 'Same-day in Mombasa. Next-day across Kenya. Free on orders over KES 3,000.' },
  { Icon: Sparkles, title: '100% Genuine', body: 'Zero counterfeits. Every product sourced from verified manufacturers.' },
];

export function ValuePropsSection() {
  return (
    <section className="py-14 px-6 lg:px-16 bg-[#FAF4EC]">
      <div className="max-w-[1380px] mx-auto">
        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#C4704A] font-medium mb-2">Why Malaika Nest</p>
          <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-[#1A3A2A]">
            Built for Kenyan parents
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUE_PROPS.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 border border-[#EDE3D8] hover:border-[#C9A96E]/40 hover:shadow-md transition-all"
            >
              <Icon className="w-8 h-8 text-[#C4704A] mb-4" />
              <h3 className="font-semibold text-[#1A3A2A] mb-2">{title}</h3>
              <p className="text-sm text-[#5C4033] leading-relaxed font-light">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const reviews = [
    { initials: 'AW', name: 'Amina Wanjiku', city: 'Nairobi', rating: 5, text: 'I was nervous ordering baby clothes online but Malaika Nest exceeded expectations. The quality is genuinely premium and delivery to Nairobi was next day!' },
    { initials: 'FK', name: 'Fatuma Kazungu', city: 'Mombasa', rating: 5, text: 'M-Pesa checkout is so smooth. Bought a full nursery set and it arrived the same evening. The mattress protector is worth every shilling.' },
    { initials: 'GN', name: 'Grace Njeri', city: 'Eldoret', rating: 5, text: 'Finally a baby store that feels trustworthy. Fair prices, beautiful packaging, and my daughter loves the soft toys. Will always shop here.' },
  ];

  return (
    <section className="py-14 px-6 lg:px-16 bg-[#FDF8F3]">
      <div className="max-w-[1380px] mx-auto">
        <div className="mb-8">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#C4704A] font-medium mb-1.5">
            <span className="block w-5 h-px bg-[#C4704A]" />
            Customer Reviews
          </p>
          <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-[#1A3A2A]">
            What Kenyan parents are saying
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="bg-[#FAF4EC] rounded-2xl p-6 border border-[#EDE3D8]"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-[#C9A96E] text-[#C9A96E]" />
                ))}
              </div>
              <p className="text-sm text-[#5C4033] leading-relaxed italic font-light mb-5">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A3A2A] flex items-center justify-center font-serif text-sm font-semibold text-[#E8C98A]">
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2C1810]">{r.name}</p>
                  <p className="text-xs text-[#8A7060]">{r.city}, Kenya</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) {
      setSubmitted(true);
    }
  };

  return (
    <section className="py-14 px-6 lg:px-16 bg-[#1A3A2A]">
      <div className="max-w-[640px] mx-auto text-center">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#E8C98A] font-medium mb-3">Stay connected</p>
        <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-white mb-3">
          New arrivals &amp; exclusive offers
        </h2>
        <p className="text-white/60 text-sm font-light mb-7 leading-relaxed">
          Join 2,400+ Kenyan parents. No spam, just good products and honest deals.
        </p>
        {submitted ? (
          <div className="bg-[#E8C98A]/10 border border-[#E8C98A]/30 rounded-xl py-4 px-6 text-[#E8C98A] text-sm font-medium">
            Welcome to the Malaika Nest family.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#E8C98A]/50"
            />
            <button
              type="submit"
              className="bg-[#C4704A] hover:bg-[#D4835E] text-white text-sm font-medium px-6 py-3 rounded-full transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
