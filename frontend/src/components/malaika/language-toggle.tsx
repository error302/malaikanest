'use client';

import { useI18n } from '@/lib/i18n';
import { Languages } from 'lucide-react';

/**
 * Language toggle button — switches between English and Swahili.
 * Shows the current language and toggles on click.
 */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, toggle } = useI18n();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all cursor-pointer select-none ${className}`}
      style={{
        background: lang === 'sw' ? 'var(--brand-gold)' : 'var(--brand-warm)',
        color: lang === 'sw' ? '#FFFFFF' : 'var(--brand-brown)',
        border: '1px solid var(--brand-border)',
      }}
      aria-label={`Switch to ${lang === 'en' ? 'Swahili' : 'English'}`}
      title={lang === 'en' ? 'Badilisha kuwa Kiswahili' : 'Switch to English'}
    >
      <Languages size={13} className="flex-shrink-0" />
      <span className="leading-none">{lang === 'en' ? 'EN' : 'SW'}</span>
    </button>
  );
}
