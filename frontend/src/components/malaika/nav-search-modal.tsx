'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface NavSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  suggestions: string[];
  onSubmit: (query: string) => void;
}

export function NavSearchModal({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  suggestions,
  onSubmit,
}: NavSearchModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-20 sm:pt-24 px-4 animate-fade-in-up"
      style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-warm-xl w-full max-w-2xl p-5 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-warm)]"
          style={{ color: 'var(--brand-text-muted)' }}
          aria-label="Close search"
        >
          <X size={20} />
        </button>
        <p
          className="text-[11px] uppercase tracking-[0.14em] mb-3 font-semibold"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          {t('nav.searchOverlayLabel')}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              onSubmit(searchQuery.trim());
            }
          }}
          className="flex flex-col sm:flex-row gap-3"
          role="search"
        >
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('nav.searchPlaceholder')}
            className="flex-1 rounded-xl px-4 py-3 text-sm transition-colors"
            style={{
              border: '1px solid var(--brand-border)',
              color: 'var(--brand-text)',
              background: 'var(--brand-bg-alt)',
            }}
            aria-label={t('nav.search')}
          />
          <button
            type="submit"
            className="rounded-xl px-6 py-3 text-sm font-medium transition-colors"
            style={{
              background: 'var(--brand-gold)',
              color: '#FFFFFF',
            }}
          >
            {t('nav.searchAction')}
          </button>
        </form>
        <div className="mt-4 flex gap-2 flex-wrap">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSubmit(suggestion)}
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: 'var(--brand-warm)',
                color: 'var(--brand-brown)',
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
