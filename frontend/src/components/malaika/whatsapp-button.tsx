'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { getSiteSettings, type Branding } from '@/lib/settings';
import { useI18n } from '@/lib/i18n';

/**
 * Floating WhatsApp button — persistent on every page.
 * Loads the WhatsApp URL from branding settings (with a sensible default).
 */
export function WhatsAppButton() {
  const [whatsappUrl, setWhatsappUrl] = useState('https://wa.me/254726771321');
  const [expanded, setExpanded] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    getSiteSettings()
      .then(({ branding }: { branding: Branding }) => {
        if (branding?.whatsapp_url) setWhatsappUrl(branding.whatsapp_url);
      })
      .catch(() => {});
  }, []);

  // Don't render on admin pages (client-side check)
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  if (isAdmin) return null;

  return (
    <div className="fixed bottom-[calc(8rem_+_env(safe-area-inset-bottom,_0px))] right-4 lg:bottom-6 lg:right-6 z-[140]">
      {expanded && (
        <div
          id="whatsapp-chat-popup"
          className="absolute bottom-16 right-0 w-64 rounded-2xl shadow-warm-lg border p-4 animate-fade-in-up"
          style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#25D366' }}>
                <MessageCircle size={16} className="text-white" />
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{t('nav.chatWithUs')}</span>
            </div>
            <button type="button" onClick={() => setExpanded(false)} className="w-6 h-6 rounded-full flex items-center justify-center" aria-label={t('nav.close')}>
              <X size={14} style={{ color: 'var(--brand-text-muted)' }} />
            </button>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--brand-text-secondary)' }}>
            Hi! 👋 Need help choosing the perfect outfit for your little one? Message us on WhatsApp — we usually reply within minutes.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center w-full rounded-full px-4 py-2.5 text-sm font-semibold"
            style={{ background: '#25D366', color: '#FFFFFF' }}
          >
            Start Chat
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls="whatsapp-chat-popup"
        aria-label={t('nav.chatOnWhatsapp')}
        className="w-14 h-14 rounded-full shadow-warm-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ background: '#25D366' }}
      >
        {expanded ? (
          <X size={24} className="text-white" />
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        )}
        {!expanded && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse" style={{ background: 'var(--brand-terra)', border: '2px solid #FFFFFF' }} />
        )}
      </button>
    </div>
  );
}
