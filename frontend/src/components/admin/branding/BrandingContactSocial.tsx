'use client';

import { Phone } from 'lucide-react';
import { inputClass, inputStyle } from './branding-styles';

interface BrandingContactSocialProps {
  settings: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
}

export function BrandingContactSocial({ settings, onUpdate }: BrandingContactSocialProps) {
  return (
    <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Phone size={18} style={{ color: 'var(--brand-gold)' }} />
        <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
          Contact & Social
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Contact email
          </label>
          <input
            value={settings.contact_email || ''}
            onChange={(e) => onUpdate('contact_email', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Contact phone
          </label>
          <input
            value={settings.contact_phone || ''}
            onChange={(e) => onUpdate('contact_phone', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            M-Pesa Till
          </label>
          <input
            value={settings.mpesa_till || ''}
            onChange={(e) => onUpdate('mpesa_till', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Location
          </label>
          <input
            value={settings.location || ''}
            onChange={(e) => onUpdate('location', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            WhatsApp URL
          </label>
          <input
            value={settings.whatsapp_url || ''}
            onChange={(e) => onUpdate('whatsapp_url', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Facebook URL
          </label>
          <input
            value={settings.facebook_url || ''}
            onChange={(e) => onUpdate('facebook_url', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Instagram URL
          </label>
          <input
            value={settings.instagram_url || ''}
            onChange={(e) => onUpdate('instagram_url', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>
            Copyright name
          </label>
          <input
            value={settings.copyright_name || ''}
            onChange={(e) => onUpdate('copyright_name', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}
