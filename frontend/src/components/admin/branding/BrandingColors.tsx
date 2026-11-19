'use client';

import { Palette } from 'lucide-react';
import { inputClass, inputStyle } from './branding-styles';

interface BrandingColorsProps {
  primaryColor: string;
  accentColor: string;
  onUpdate: (key: string, value: string) => void;
}

export function BrandingColors({ primaryColor, accentColor, onUpdate }: BrandingColorsProps) {
  return (
    <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Palette size={18} style={{ color: 'var(--brand-gold)' }} />
        <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
          Brand Colors
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Primary (gold)
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={primaryColor || '#8B6914'}
              onChange={(e) => onUpdate('primary_color', e.target.value)}
              className="w-12 h-10 rounded-lg border"
              style={{ borderColor: 'var(--brand-border)' }}
            />
            <input
              value={primaryColor || ''}
              onChange={(e) => onUpdate('primary_color', e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Accent (terracotta)
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={accentColor || '#C4704A'}
              onChange={(e) => onUpdate('accent_color', e.target.value)}
              className="w-12 h-10 rounded-lg border"
              style={{ borderColor: 'var(--brand-border)' }}
            />
            <input
              value={accentColor || ''}
              onChange={(e) => onUpdate('accent_color', e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>
      </div>
      <p className="text-[11px] mt-2" style={{ color: 'var(--brand-text-muted)' }}>
        Note: color changes apply to new visitors after cache refresh (~60s).
      </p>
    </div>
  );
}
