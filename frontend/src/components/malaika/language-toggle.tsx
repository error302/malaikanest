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
      onClick={toggle}
      className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-all ${className}`}
      style={{
        background: lang === 'sw' ? 'var(--brand-gold)' : 'var(--brand-warm)',
        color: lang === 'sw' ? '#FFFFFF' : 'var(--brand-brown)',
      }}
      aria-label={`Switch to ${lang === 'en' ? 'Swahili' : 'English'}`}
      title={lang === 'en' ? 'Badilisha kuwa Kiswahili' : 'Switch to English'}
    >
      <Languages size={12} />
      <span>{lang === 'en' ? 'EN' : 'SW'}</span>
    </button>
  );
}
