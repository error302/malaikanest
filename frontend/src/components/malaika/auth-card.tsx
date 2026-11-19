import Link from 'next/link';
import { Logo } from '@/components/malaika/logo';

interface AuthCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-10 sm:py-16 px-4 bg-grain">
      <div className="w-full max-w-md animate-fade-in-up">
        <div
          className="relative overflow-hidden rounded-2xl border shadow-warm-md transition-shadow duration-300 hover:shadow-warm-lg"
          style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
        >
          {/* Decorative top accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{
              background:
                'linear-gradient(90deg, var(--brand-gold) 0%, var(--brand-gold-light) 50%, var(--brand-terra) 100%)',
            }}
          />

          {/* Brand mark — decorative header area */}
          <div
            className="relative pt-10 pb-6 px-8 sm:px-10 text-center overflow-hidden"
            style={{ background: 'var(--brand-bg-alt)' }}
          >
            {/* Decorative corner dots */}
            <div className="absolute top-4 right-6 flex gap-1.5" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
            </div>
            <div className="absolute bottom-4 left-6 flex gap-1.5" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold-soft)' }} />
            </div>

            {/* Welcome logo */}
            <div className="flex justify-center mb-3">
              <Link href="/" className="inline-block transition-transform hover:scale-105" aria-label="Malaika Nest Home">
                <Logo />
              </Link>
            </div>

            <h1
              className="font-serif text-3xl sm:text-4xl font-semibold leading-tight"
              style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mt-1.5" style={{ color: 'var(--brand-text-secondary)' }}>
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
