'use client';

import { Star, Quote } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  product?: string | null;
  initials?: string | null;
  isActive: boolean;
}

interface TestimonialsProps {
  content?: Record<string, Record<string, string>>;
  testimonials?: Testimonial[];
}

export function Testimonials({ content, testimonials = [] }: TestimonialsProps) {
  const { t } = useI18n();
  const c = content?.testimonials || {};
  const active = testimonials.filter((t) => t.isActive);

  return (
    <section
      className="py-12 sm:py-16 lg:py-20"
      style={{ background: 'linear-gradient(180deg, var(--brand-bg-alt) 0%, var(--brand-cream) 100%)' }}
    >
      <div className="container-shell">
        <div className="text-center max-w-2xl mx-auto mb-9 sm:mb-12">
          <span className="section-label mb-3 justify-center">{c.label || t('home.testimonialsLabel')}</span>
          <h2
            className="font-serif font-semibold tracking-tight mt-3"
            style={{
              color: 'var(--brand-text)',
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              lineHeight: 1.15,
            }}
          >
            {c.title || t('home.testimonials')}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="fill-current" style={{ color: 'var(--brand-gold)' }} />
              ))}
            </div>
            <span className="text-[13px] font-medium" style={{ color: 'var(--brand-brown)' }}>
              {c.aggregate_rating || t('home.aggregateRating')}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {active.map((t) => (
            <figure
              key={t.id}
              className="rounded-2xl p-6 sm:p-7 border flex flex-col"
              style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', boxShadow: 'var(--shadow-warm-sm)' }}
            >
              <Quote size={28} className="mb-3" style={{ color: 'var(--brand-gold-soft)' }} aria-hidden />
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < t.rating ? 'fill-current' : ''}
                    style={{ color: i < t.rating ? 'var(--brand-gold)' : 'var(--brand-border)' }}
                  />
                ))}
              </div>
              <blockquote className="text-sm sm:text-[15px] leading-relaxed flex-1" style={{ color: 'var(--brand-text-secondary)' }}>
                &ldquo;{t.text}&rdquo;
              </blockquote>
              {t.product && (
                <p className="text-[11px] mt-3 font-medium uppercase tracking-wider" style={{ color: 'var(--brand-gold)' }}>
                  {t.product}
                </p>
              )}
              <figcaption className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--brand-border)' }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-[12px]"
                  style={{ background: 'var(--brand-gold-soft)', color: 'var(--brand-brown-dark)' }}
                >
                  {t.initials || t.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--brand-text)' }}>{t.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--brand-text-muted)' }}>{t.location}, Kenya</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
