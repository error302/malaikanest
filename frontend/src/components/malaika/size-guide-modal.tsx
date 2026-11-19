'use client';

import { useState, useEffect } from 'react';
import { X, Ruler, Info } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'baby' | 'toddler'>('baby');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const babySizes = [
    { size: 'Preemie (P)', age: 'Pre-term', weightKg: 'Up to 2.3 kg', weightLbs: 'Up to 5 lbs', heightCm: 'Up to 43 cm', heightIn: 'Up to 17 in' },
    { size: 'Newborn (NB)', age: '0 – 1 Month', weightKg: 'Up to 3.2 kg', weightLbs: 'Up to 7.5 lbs', heightCm: 'Up to 55 cm', heightIn: 'Up to 21.5 in' },
    { size: '3M', age: '0 – 3 Months', weightKg: '3.2 – 5.7 kg', weightLbs: '7.5 – 12.5 lbs', heightCm: '55 – 61 cm', heightIn: '21.5 – 24 in' },
    { size: '6M', age: '3 – 6 Months', weightKg: '5.7 – 7.5 kg', weightLbs: '12.5 – 16.5 lbs', heightCm: '61 – 67 cm', heightIn: '24 – 26.5 in' },
    { size: '9M', age: '6 – 9 Months', weightKg: '7.5 – 9.3 kg', weightLbs: '16.5 – 20.5 lbs', heightCm: '67 – 72 cm', heightIn: '26.5 – 28.5 in' },
    { size: '12M', age: '9 – 12 Months', weightKg: '9.3 – 11.1 kg', weightLbs: '20.5 – 24.5 lbs', heightCm: '72 – 78 cm', heightIn: '28.5 – 30.5 in' },
    { size: '18M', age: '12 – 18 Months', weightKg: '11.1 – 12.5 kg', weightLbs: '24.5 – 27.5 lbs', heightCm: '78 – 83 cm', heightIn: '30.5 – 32.5 in' },
    { size: '24M', age: '18 – 24 Months', weightKg: '12.5 – 13.6 kg', weightLbs: '27.5 – 30 lbs', heightCm: '83 – 86 cm', heightIn: '32.5 – 34 in' },
  ];

  const toddlerSizes = [
    { size: '2T', age: '2 Years', weightKg: '13.2 – 14.1 kg', weightLbs: '29 – 31 lbs', heightCm: '88 – 93 cm', heightIn: '35 – 36.5 in' },
    { size: '3T', age: '3 Years', weightKg: '14.1 – 15.4 kg', weightLbs: '31 – 34 lbs', heightCm: '93 – 98 cm', heightIn: '36.5 – 38.5 in' },
    { size: '4T', age: '4 Years', weightKg: '15.4 – 17.2 kg', weightLbs: '34 – 38 lbs', heightCm: '98 – 105 cm', heightIn: '38.5 – 41.5 in' },
    { size: '5T', age: '5 Years', weightKg: '17.2 – 19.1 kg', weightLbs: '38 – 42 lbs', heightCm: '105 – 112 cm', heightIn: '41.5 – 44 in' },
    { size: '6', age: '6 Years', weightKg: '19.1 – 22.0 kg', weightLbs: '42 – 48 lbs', heightCm: '112 – 118 cm', heightIn: '44 – 46.5 in' },
    { size: '7', age: '7 Years', weightKg: '22.0 – 25.0 kg', weightLbs: '48 – 55 lbs', heightCm: '118 – 125 cm', heightIn: '46.5 – 49 in' },
  ];

  const currentList = activeTab === 'baby' ? babySizes : toddlerSizes;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-[var(--brand-border)] flex flex-col overflow-hidden animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[var(--brand-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-warm)' }}>
              <Ruler size={20} style={{ color: 'var(--brand-gold)' }} />
            </div>
            <div>
              <h2
                id="size-guide-title"
                className="font-serif text-xl sm:text-2xl font-semibold"
                style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
              >
                Baby &amp; Toddler Size Guide
              </h2>
              <p className="text-xs text-[var(--brand-text-muted)]">
                Carter&apos;s standard metric &amp; imperial size conversions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="w-9 h-9 rounded-full border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] hover:bg-[var(--brand-warm)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Controls: Tabs & Units */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6 bg-[var(--brand-bg-alt)] border-b border-[var(--brand-border)]">
          {/* Age Group Tabs */}
          <div className="inline-flex rounded-xl p-1 bg-white border border-[var(--brand-border)]">
            <button
              type="button"
              onClick={() => setActiveTab('baby')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'baby'
                  ? 'bg-[var(--brand-gold)] text-white shadow-sm'
                  : 'text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)]'
              }`}
            >
              Baby (0 – 24M)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('toddler')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'toddler'
                  ? 'bg-[var(--brand-gold)] text-white shadow-sm'
                  : 'text-[var(--brand-text-secondary)] hover:text-[var(--brand-text)]'
              }`}
            >
              Toddler &amp; Kids (2T – 7Y)
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--brand-text-secondary)]">
            <span>Units:</span>
            <div className="inline-flex rounded-lg p-0.5 bg-white border border-[var(--brand-border)]">
              <button
                type="button"
                onClick={() => setUnit('metric')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  unit === 'metric'
                    ? 'bg-[var(--brand-gold)] text-white'
                    : 'text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]'
                }`}
              >
                kg / cm
              </button>
              <button
                type="button"
                onClick={() => setUnit('imperial')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  unit === 'imperial'
                    ? 'bg-[var(--brand-gold)] text-white'
                    : 'text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]'
                }`}
              >
                lbs / in
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh]">
          <div className="rounded-2xl border border-[var(--brand-border)] overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[var(--brand-warm)] border-b border-[var(--brand-border)] text-[var(--brand-text)] font-semibold">
                  <th className="p-3 sm:p-3.5">Size</th>
                  <th className="p-3 sm:p-3.5">Typical Age</th>
                  <th className="p-3 sm:p-3.5">Weight ({unit === 'metric' ? 'kg' : 'lbs'})</th>
                  <th className="p-3 sm:p-3.5">Height ({unit === 'metric' ? 'cm' : 'inches'})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--brand-border)]">
                {currentList.map((row, idx) => (
                  <tr key={row.size} className={idx % 2 === 0 ? 'bg-white' : 'bg-[var(--brand-bg-alt)]/50'}>
                    <td className="p-3 sm:p-3.5 font-bold text-[var(--brand-gold)]">{row.size}</td>
                    <td className="p-3 sm:p-3.5 text-[var(--brand-text)] font-medium">{row.age}</td>
                    <td className="p-3 sm:p-3.5 text-[var(--brand-text-secondary)]">
                      {unit === 'metric' ? row.weightKg : row.weightLbs}
                    </td>
                    <td className="p-3 sm:p-3.5 text-[var(--brand-text-secondary)]">
                      {unit === 'metric' ? row.heightCm : row.heightIn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pro Tips Box */}
          <div className="mt-5 p-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-bg-alt)] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-[var(--brand-gold)]">
              <Info size={16} />
              <span>Helpful Sizing Guidelines for Parents</span>
            </div>
            <ul className="text-xs text-[var(--brand-text-secondary)] space-y-1.5 list-disc list-inside">
              <li>
                <strong>When in doubt, always size up:</strong> Babies and toddlers grow rapidly. Sizing up ensures longer use and comfortable breathing room.
              </li>
              <li>
                <strong>Fit by weight &amp; length, not just age:</strong> Age ranges are general guidelines; every baby is wonderfully unique in build and growth rate.
              </li>
              <li>
                <strong>100% Cotton factor:</strong> Natural cotton may experience slight shrinkage (approx. 2–3%) after initial cold wash.
              </li>
              <li>
                <strong>72-Hour Return &amp; Exchange Policy:</strong> If a piece doesn&apos;t fit your child, exchange requests must be filed within <strong>72 hours of delivery</strong> with the original brand tags attached and untampered.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-[var(--brand-warm)] border-t border-[var(--brand-border)] flex items-center justify-between">
          <span className="text-xs text-[var(--brand-text-muted)]">
            Questions on sizing? <a href="https://wa.me/254726771321" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-[var(--brand-gold)]">Chat on WhatsApp</a>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-[var(--brand-gold)] text-white hover:opacity-95 transition-opacity"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
