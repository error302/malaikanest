'use client';

import { type RefObject } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { inputClass, inputStyle } from './branding-styles';

interface BrandingLogoFaviconProps {
  logoUrl: string;
  faviconUrl: string;
  logoFileRef: RefObject<HTMLInputElement | null>;
  faviconFileRef: RefObject<HTMLInputElement | null>;
  onUpdate: (key: string, value: string) => void;
  onUpload: (key: 'logo_url' | 'favicon_url', fileRef: RefObject<HTMLInputElement | null>) => void;
}

export function BrandingLogoFavicon({
  logoUrl,
  faviconUrl,
  logoFileRef,
  faviconFileRef,
  onUpdate,
  onUpload,
}: BrandingLogoFaviconProps) {
  return (
    <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon size={18} style={{ color: 'var(--brand-gold)' }} />
        <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
          Logo & Favicon
        </h2>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Logo URL
          </label>
          <div className="flex gap-2">
            <input
              value={logoUrl}
              onChange={(e) => onUpdate('logo_url', e.target.value)}
              placeholder="https://res.cloudinary.com/…/logo.png (leave empty for built-in SVG)"
              className={inputClass}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => logoFileRef.current?.click()}
              className="px-3 rounded-xl text-sm font-medium flex-shrink-0"
              style={{ background: 'var(--brand-warm)', color: 'var(--brand-gold)' }}
            >
              Upload
            </button>
            <input
              ref={logoFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={() => onUpload('logo_url', logoFileRef)}
            />
          </div>
          {logoUrl && (
            <div className="mt-2 inline-block p-2 rounded-xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
              <img src={logoUrl} alt="Logo preview" className="h-12 w-auto object-contain" />
            </div>
          )}
          <p className="text-[11px] mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            Upload a file or paste a Cloudinary/CDN URL. Leave empty to use the built-in swaddle-baby SVG logo.
          </p>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Favicon URL
          </label>
          <div className="flex gap-2">
            <input
              value={faviconUrl}
              onChange={(e) => onUpdate('favicon_url', e.target.value)}
              placeholder="https://res.cloudinary.com/…/favicon.ico (leave empty for /logo.svg)"
              className={inputClass}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => faviconFileRef.current?.click()}
              className="px-3 rounded-xl text-sm font-medium flex-shrink-0"
              style={{ background: 'var(--brand-warm)', color: 'var(--brand-gold)' }}
            >
              Upload
            </button>
            <input
              ref={faviconFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,.ico"
              className="hidden"
              onChange={() => onUpload('favicon_url', faviconFileRef)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
