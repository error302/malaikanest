import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ShoppingBasket, Heart, Sparkles, Shield, RotateCcw, Truck } from 'lucide-react';
import { getThriftedBySlug, CONDITION_LABELS } from '@/lib/thrifted';
import { ThriftedDetailClient } from './thrifted-detail-client';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getThriftedBySlug(slug);
  if (!product) return { title: 'Thrifted item not found' };
  return {
    title: `${product.name} (Mtumba)`,
    description: product.description.slice(0, 160),
    openGraph: { title: product.name, description: product.description, images: [product.image] },
  };
}

export default async function ThriftedDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getThriftedBySlug(slug);
  if (!product) notFound();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const images = [product.image, product.image2, product.image3].filter(Boolean);

  return (
    <div className="container-shell py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-xs flex-wrap">
        <Link href="/" className="hover:text-[var(--brand-gold)]" style={{ color: 'var(--brand-text-muted)' }}>Home</Link>
        <ChevronRight size={12} style={{ color: 'var(--brand-text-muted)' }} />
        <Link href="/thrifted" className="hover:text-[var(--brand-gold)]" style={{ color: 'var(--brand-text-muted)' }}>Mtumba</Link>
        <ChevronRight size={12} style={{ color: 'var(--brand-text-muted)' }} />
        <span className="truncate max-w-[200px]" style={{ color: 'var(--brand-brown)' }}>{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
        {/* Image gallery */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden border" style={{ background: 'var(--brand-warm)', borderColor: 'var(--brand-border)' }}>
            <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ background: 'var(--brand-terra)', color: '#FFFFFF' }}>
              <Sparkles size={12} /> Mtumba
            </div>
            {discount > 0 && (
              <div className="absolute top-4 right-4 z-10 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
                Save {discount}%
              </div>
            )}
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {images.map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border" style={{ background: 'var(--brand-warm)', borderColor: 'var(--brand-border)' }}>
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.brand && (
            <div className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: 'var(--brand-text-muted)' }}>
              {product.brand}
            </div>
          )}
          <h1 className="font-serif font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.15 }}>
            {product.name}
          </h1>

          {/* Condition + attributes */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(196,112,74,0.12)', color: 'var(--brand-terra)' }}>
              {CONDITION_LABELS[product.condition] || product.condition} condition
            </span>
            {product.size && <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--brand-warm)', color: 'var(--brand-brown)' }}>Size: {product.size}</span>}
            {product.gender && <span className="text-xs px-3 py-1 rounded-full capitalize" style={{ background: 'var(--brand-warm)', color: 'var(--brand-brown)' }}>{product.gender}</span>}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-2xl font-semibold" style={{ color: 'var(--brand-text)' }}>
              KES {product.price.toLocaleString('en-KE')}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-base line-through" style={{ color: 'var(--brand-text-muted)' }}>
                  KES {product.originalPrice.toLocaleString('en-KE')}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--brand-green-light)' }}>
                  Save KES {(product.originalPrice - product.price).toLocaleString('en-KE')}
                </span>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Description</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>{product.description}</p>
            </div>
          )}

          {/* One-of-a-kind notice */}
          <div className="p-3 rounded-xl mb-5 flex items-start gap-2" style={{ background: 'rgba(196,112,74,0.08)', border: '1px solid rgba(196,112,74,0.2)' }}>
            <Sparkles size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-terra)' }} />
            <p className="text-xs" style={{ color: 'var(--brand-brown)' }}>
              <strong>One-of-a-kind.</strong> This is a pre-loved item — only one available. Once it&apos;s sold, it&apos;s gone!
            </p>
          </div>

          <ThriftedDetailClient product={product} />

          {/* Trust */}
          <div className="grid grid-cols-3 gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--brand-border)' }}>
            {[
              { Icon: Truck, label: 'Fast delivery' },
              { Icon: Shield, label: 'Quality checked' },
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
