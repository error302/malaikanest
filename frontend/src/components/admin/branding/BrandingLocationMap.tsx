'use client';

import { MapPin } from 'lucide-react';
import { inputClass, inputStyle } from './branding-styles';

interface BrandingLocationMapProps {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
}

export function BrandingLocationMap({ settings, onUpdate }: BrandingLocationMapProps) {
  return (
    <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={18} style={{ color: 'var(--brand-gold)' }} />
        <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
          Find Us Page — Location & Map
        </h2>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Address (displayed on Find Us page)
          </label>
          <input
            value={settings.address_line || ''}
            onChange={(e) => onUpdate('address_line', e.target.value)}
            placeholder="e.g. Nyali Road, Mombasa, Kenya"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Directions / notes
          </label>
          <textarea
            value={settings.address_directions || ''}
            onChange={(e) => onUpdate('address_directions', e.target.value)}
            rows={2}
            placeholder="Visit our workshop in Mombasa for in-person shopping and pickups. Call ahead to ensure we're in!"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Google Maps embed URL
          </label>
          <input
            value={settings.map_embed_url || ''}
            onChange={(e) => onUpdate('map_embed_url', e.target.value)}
            placeholder="https://www.google.com/maps?q=...&output=embed"
            className={inputClass}
            style={inputStyle}
          />
          <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            To get a custom embed: go to{' '}
            <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline">
              Google Maps
            </a>
            , search your address, click Share → Embed a map → copy the <code>src</code> URL. Or use the simple format:{' '}
            <code>https://www.google.com/maps?q=YOUR_ADDRESS&output=embed</code>
          </p>
        </div>
        {settings.map_embed_url && (
          <div className="mt-2 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--brand-border)' }}>
            <iframe
              src={settings.map_embed_url}
              width="100%"
              height="200"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              title="Map preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
