import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ShoppingBasket, Heart, Truck, Shield, RotateCcw } from 'lucide-react';
import { getImageUrl } from '@/lib/media';
import { ProductDetailClient } from './product-detail-client';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

function getApiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://malaikanest.duckdns.org'
  );
}

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/products/products/${slug}/`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data ?? data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product not found' };
  return {
    title: product.name,
    description: product.seo_description || product.description?.slice(0, 160) || product.name,
    openGraph: {
      title: product.name,
      description: product.seo_description || product.name,
      images: product.image ? [getImageUrl(product.image)] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const imageUrl = product.image ? getImageUrl(product.image) : null;
  const price = parseFloat(product.price ?? '0');
  const originalPrice = product.compare_price ? parseFloat(product.compare_price) : null;
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const inStock = (product.available_stock ?? product.stock ?? 0) > 0;

  return (
    <div className="container-shell py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs flex-wrap">
        <Link href="/" className="hover:text-[var(--brand-gold)]" style={{ color: 'var(--brand-text-muted)' }}>Home</Link>
        <ChevronRight size={12} style={{ color: 'var(--brand-text-muted)' }} />
        <Link href="/categories" className="hover:text-[var(--brand-gold)]" style={{ color: 'var(--brand-text-muted)' }}>Shop</Link>
        {product.category?.name && (
          <>
            <ChevronRight size={12} style={{ color: 'var(--brand-text-muted)' }} />
            <span style={{ color: 'var(--brand-text-muted)' }}>{product.category.name}</span>
          </>
        )}
        <ChevronRight size={12} style={{ color: 'var(--brand-text-muted)' }} />
        <span className="truncate max-w-[200px]" style={{ color: 'var(--brand-brown)' }}>{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
        {/* Image */}
        <div className="relative">
          <div
            className="aspect-square rounded-2xl overflow-hidden border"
            style={{ background: 'var(--brand-warm)', borderColor: 'var(--brand-border)' }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-serif text-8xl opacity-20" style={{ color: 'var(--brand-gold)', fontFamily: 'var(--font-cormorant)' }}>
                  {product.name?.charAt(0)}
                </span>
              </div>
            )}
          </div>
          {discount > 0 && (
            <span
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ background: 'var(--brand-gold)' }}
            >
              -{discount}% OFF
            </span>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category?.name && (
            <div className="text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--brand-text-muted)' }}>
              {product.category.name}
            </div>
          )}
          <h1
            className="font-serif font-semibold mb-3"
            style={{
              color: 'var(--brand-text)',
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              lineHeight: 1.15,
            }}
          >
            {product.name}
          </h1>

          {product.rating && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium" style={{ color: 'var(--brand-gold)' }}>
                ★ {Number(product.rating).toFixed(1)}
              </span>
              {product.review_count && (
                <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                  ({product.review_count} reviews)
                </span>
              )}
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-2xl font-semibold" style={{ color: 'var(--brand-text)' }}>
              KES {price.toLocaleString('en-KE')}
            </span>
            {originalPrice && (
              <span className="text-base line-through" style={{ color: 'var(--brand-text-muted)' }}>
                KES {originalPrice.toLocaleString('en-KE')}
              </span>
            )}
          </div>

          {product.description && (
            <div className="prose prose-sm max-w-none mb-6">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>
                {product.description}
              </p>
            </div>
          )}

          <ProductDetailClient
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price,
              image: imageUrl,
              inStock,
              hasVariants: Boolean(product.has_variants),
            }}
          />

          {/* Trust */}
          <div className="grid grid-cols-3 gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--brand-border)' }}>
            {[
              { Icon: Truck, label: 'Fast delivery' },
              { Icon: Shield, label: 'Secure M-Pesa' },
              { Icon: RotateCcw, label: '7-day returns' },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <Icon size={20} style={{ color: 'var(--brand-gold)' }} />
                <span className="text-[11px]" style={{ color: 'var(--brand-text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
