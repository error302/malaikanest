'use client';

import { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export function ProductSafetyAccordions() {
  const [openAccordion, setOpenAccordion] = useState<string | null>('safety');

  return (
    <div className="space-y-2 pt-4">
      {/* Safety & SIDS Precautions */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--brand-border)', background: '#FFFFFF' }}
      >
        <button
          type="button"
          onClick={() => setOpenAccordion(openAccordion === 'safety' ? null : 'safety')}
          className="w-full flex items-center justify-between p-4 text-left text-xs font-semibold transition-colors"
          style={{ color: 'var(--brand-text)' }}
        >
          <span className="flex items-center gap-2.5">
            <ShieldCheck size={16} style={{ color: 'var(--brand-gold)' }} />
            Infant Sleep Safety &amp; Choking Hazards
          </span>
          {openAccordion === 'safety' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {openAccordion === 'safety' && (
          <div
            className="px-4 pb-4 pt-1 text-xs space-y-2 border-t"
            style={{
              borderColor: 'var(--brand-border)',
              color: 'var(--brand-text-secondary)',
              background: 'var(--brand-bg-alt)',
            }}
          >
            <p>
              <strong>Safe Sleep Advisory (SIDS Precautions):</strong> In accordance with pediatric
              safe sleep guidelines, always remove headbands, bibs, loose bows, ties, and hats before
              placing an infant to sleep or leaving them unattended in a cot.
            </p>
            <p>
              <strong>Inspection Before Wear:</strong> Regularly check all buttons, snaps,
              embroidery, and decorative trims. Discontinue use if any fastener or attachment becomes
              loose.
            </p>
          </div>
        )}
      </div>

      {/* Fabric & Skin Health */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--brand-border)', background: '#FFFFFF' }}
      >
        <button
          type="button"
          onClick={() => setOpenAccordion(openAccordion === 'fabric' ? null : 'fabric')}
          className="w-full flex items-center justify-between p-4 text-left text-xs font-semibold transition-colors"
          style={{ color: 'var(--brand-text)' }}
        >
          <span className="flex items-center gap-2.5">
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: 'var(--brand-green-light)', color: '#FFFFFF' }}
            >
              ✓
            </span>
            Pure Combed Cotton &amp; Nickel-Free Hardware
          </span>
          {openAccordion === 'fabric' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {openAccordion === 'fabric' && (
          <div
            className="px-4 pb-4 pt-1 text-xs space-y-2 border-t"
            style={{
              borderColor: 'var(--brand-border)',
              color: 'var(--brand-text-secondary)',
              background: 'var(--brand-bg-alt)',
            }}
          >
            <p>
              Crafted from ultra-soft combed natural cotton that breathes naturally in coastal and
              inland Kenyan heat, helping prevent heat rash and eczema flares.
            </p>
            <p>
              Equipped with nickel-free snaps and covered elastics to eliminate allergic skin
              irritation.
            </p>
          </div>
        )}
      </div>

      {/* Washing & Care */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--brand-border)', background: '#FFFFFF' }}
      >
        <button
          type="button"
          onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}
          className="w-full flex items-center justify-between p-4 text-left text-xs font-semibold transition-colors"
          style={{ color: 'var(--brand-text)' }}
        >
          <span className="flex items-center gap-2.5">
            <span className="text-[14px]">🧺</span>
            Garment Care &amp; Washing Instructions
          </span>
          {openAccordion === 'care' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {openAccordion === 'care' && (
          <div
            className="px-4 pb-4 pt-1 text-xs space-y-1.5 border-t"
            style={{
              borderColor: 'var(--brand-border)',
              color: 'var(--brand-text-secondary)',
              background: 'var(--brand-bg-alt)',
            }}
          >
            <ul className="list-disc list-inside space-y-1">
              <li>Machine wash cold (30°C) with mild, baby-safe laundry detergent.</li>
              <li>
                Wash with similar colors; do not use chlorine bleach or industrial softeners.
              </li>
              <li>Tumble dry on low or line dry in shade to retain shape and softness.</li>
              <li>Iron on low heat on reverse; never iron directly over prints or snaps.</li>
            </ul>
          </div>
        )}
      </div>

      {/* 72-Hour Return & Tag Guarantee */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--brand-border)', background: '#FFFFFF' }}
      >
        <button
          type="button"
          onClick={() => setOpenAccordion(openAccordion === 'returns' ? null : 'returns')}
          className="w-full flex items-center justify-between p-4 text-left text-xs font-semibold transition-colors"
          style={{ color: 'var(--brand-text)' }}
        >
          <span className="flex items-center gap-2.5">
            <span className="text-[14px]">🏷️</span>
            72-Hour Returns &amp; Tag Guarantee
          </span>
          {openAccordion === 'returns' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {openAccordion === 'returns' && (
          <div
            className="px-4 pb-4 pt-1 text-xs space-y-2 border-t"
            style={{
              borderColor: 'var(--brand-border)',
              color: 'var(--brand-text-secondary)',
              background: 'var(--brand-bg-alt)',
            }}
          >
            <p>
              <strong>Original Tags Attached:</strong> Sizing exchanges require that all original
              brand tags, neck tags, and barcode seals remain attached and untampered.
            </p>
            <p>
              <strong>72-Hour Limit:</strong> Sizing exchanges must be notified to us within{' '}
              <strong>72 hours of courier delivery</strong>. Customer covers return courier transit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
