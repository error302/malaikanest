'use client';

import { ProductCard, type Product } from '@/components/malaika/product-card';

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-12 pt-8" style={{ borderTop: '1px solid var(--brand-border)' }}>
      <div className="mb-5">
        <span className="section-label mb-3">You may also like</span>
        <h2 className="font-serif font-semibold tracking-tight mt-3" style={{
          color: 'var(--brand-text)',
          fontFamily: 'var(--font-cormorant)',
          fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
          lineHeight: 1.15,
        }}>
          Complete the Look
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
