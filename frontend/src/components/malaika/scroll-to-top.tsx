'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Floating scroll-to-top button that appears after the user scrolls past a threshold.
 * Smoothly scrolls to the top on click. Hides automatically at the top of the page.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Don't render on admin pages
  const isAdmin =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  if (isAdmin) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed bottom-[calc(6rem_+_env(safe-area-inset-bottom,_0px))] right-4 lg:bottom-6 lg:right-6 z-[130] w-11 h-11 rounded-full shadow-warm-lg border flex items-center justify-center transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{
        background: 'rgba(255,255,255,0.95)',
        borderColor: 'var(--brand-border)',
        color: 'var(--brand-brown)',
        backdropFilter: 'blur(8px)',
      }}
    >              <ArrowUp size={20} strokeWidth={2} />
    </button>
  );
}
