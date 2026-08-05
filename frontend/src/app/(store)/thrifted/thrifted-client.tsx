'use client';

import { useEffect, useState } from 'react';
import { Sparkles, SlidersHorizontal, X } from 'lucide-react';
import { ThriftedCard } from '@/components/malaika/thrifted-card';
import type { ThriftedProduct } from '@/lib/thrifted';

const CONDITIONS = [
  { label: 'All conditions', value: 'all' },
  { label: 'Like New', value: 'like_new' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
];

const GENDERS = [
  { label: 'All', value: 'all' },
  { label: 'Boys', value: 'boy' },
  { label: 'Girls', value: 'girl' },
  { label: 'Unisex', value: 'unisex' },
];

const AGE_GROUPS = [
  { label: 'All ages', value: 'all' },
  { label: 'Baby (0-2)', value: 'baby' },
  { label: 'Toddler (2-5)', value: 'toddler' },
  { label: 'Kids (6-12)', value: 'kids' },
];

export function ThriftedPageClient() {
  const [products, setProducts] = useState<ThriftedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [condition, setCondition] = useState('all');
  const [gender, setGender] = useState('all');
  const [ageGroup, setAgeGroup] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (condition !== 'all') params.set('condition', condition);
        if (gender !== 'all') params.set('gender', gender);
        if (ageGroup !== 'all') params.set('ageGroup', ageGroup);
        const res = await fetch(`/api/thrifted?${params.toString()}`);
        if (cancelled) return;
        const data = await res.json();
        setProducts(data.products || []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [condition, gender, ageGroup]);

  return (
    <div className="container-shell py-6 sm:py-10">
      {/* Header */}
      <div className="mb-7 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4" style={{ background: 'rgba(196,112,74,0.12)' }}>
          <Sparkles size={14} style={{ color: 'var(--brand-terra)' }} />
          <span className="text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--brand-terra)' }}>
            Mtumba · Thrifted
          </span>
        </div>
        <h1 className="font-serif font-semibold tracking-tight" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', lineHeight: 1.15 }}>
          Pre-loved Treasures
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
          Gently-used premium baby & kids clothing at a fraction of the price. Each item is one-of-a-kind — grab it before it&apos;s gone!
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm"
          style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
        <p className="text-sm hidden lg:block" style={{ color: 'var(--brand-text-muted)' }}>
          {loading ? 'Loading…' : `${products.length} item${products.length === 1 ? '' : 's'} available`}
        </p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 p-5 rounded-2xl border space-y-5" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <FilterGroup label="Condition" options={CONDITIONS} value={condition} onChange={setCondition} />
            <FilterGroup label="Gender" options={GENDERS} value={gender} onChange={setGender} />
            <FilterGroup label="Age Group" options={AGE_GROUPS} value={ageGroup} onChange={setAgeGroup} />
          </div>
        </aside>

        {/* Products grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border animate-pulse" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
                  <div className="aspect-[4/5]" style={{ background: 'var(--brand-warm)' }} />
                  <div className="p-4 space-y-2"><div className="h-3 w-3/4" style={{ background: 'var(--brand-warm)' }} /><div className="h-3 w-1/2" style={{ background: 'var(--brand-warm)' }} /></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>No thrifted items match your filters. Try broadening your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
              {products.map((p, i) => <ThriftedCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-[200] lg:hidden" style={{ background: 'rgba(44,24,16,0.5)' }} onClick={() => setShowFilters(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85%] p-5 overflow-y-auto" style={{ background: 'var(--brand-cream)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold" style={{ color: 'var(--brand-text)' }}>Filters</h2>
              <button type="button" onClick={() => setShowFilters(false)} aria-label="Close"><X size={20} style={{ color: 'var(--brand-brown)' }} /></button>
            </div>
            <div className="space-y-5">
              <FilterGroup label="Condition" options={CONDITIONS} value={condition} onChange={setCondition} />
              <FilterGroup label="Gender" options={GENDERS} value={gender} onChange={setGender} />
              <FilterGroup label="Age Group" options={AGE_GROUPS} value={ageGroup} onChange={setAgeGroup} />
            </div>
            <button type="button" onClick={() => setShowFilters(false)} className="mt-6 w-full rounded-full px-6 py-3 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>Show Results</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, options, value, onChange }: { label: string; options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>{label}</label>
      <div className="space-y-1">
        {options.map((opt) => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)} className="block w-full text-left text-sm px-3 py-2 min-h-[44px] flex items-center rounded-lg transition-colors" style={{ background: value === opt.value ? 'var(--brand-warm)' : 'transparent', color: value === opt.value ? 'var(--brand-gold)' : 'var(--brand-brown)', fontWeight: value === opt.value ? 600 : 400 }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
