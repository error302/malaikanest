'use client';

import { Globe } from 'lucide-react';
import { inputClass, inputStyle } from './branding-styles';

interface BrandingStoreIdentityProps {
  storeName: string;
  tagline: string;
  footerTagline: string;
  onUpdate: (key: string, value: string) => void;
}

export function BrandingStoreIdentity({
  storeName,
  tagline,
  footerTagline,
  onUpdate,
}: BrandingStoreIdentityProps) {
  return (
    <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Globe size={18} style={{ color: 'var(--brand-gold)' }} />
        <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
          Store Identity
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Store name
          </label>
          <input
            value={storeName}
            onChange={(e) => onUpdate('store_name', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Tagline
          </label>
          <input
            value={tagline}
            onChange={(e) => onUpdate('tagline', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Footer tagline
          </label>
          <textarea
            value={footerTagline}
            onChange={(e) => onUpdate('footer_tagline', e.target.value)}
            rows={2}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}
