'use client';

import { useEffect, useState } from 'react';

interface AnnouncementBarProps {
  messages?: string[];
}

export function AnnouncementBar({ messages = [] }: AnnouncementBarProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4500);
    return () => clearInterval(t);
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div
      className="relative z-[60] overflow-hidden text-center text-[11px] sm:text-xs py-2.5 px-4 font-light tracking-wide"
      style={{
        background: 'var(--brand-gold)',
        color: '#FFFFFF',
      }}
      role="banner"
      aria-live="polite"
    >
      <div
        key={index}
        className="animate-fade-in-up inline-flex items-center gap-2"
      >
        <span
          className="inline-block w-1 h-1 rounded-full"
          style={{ background: 'var(--brand-gold-soft)' }}
          aria-hidden
        />
        <span dangerouslySetInnerHTML={{ __html: messages[index] || messages[0] }} />
      </div>
    </div>
  );
}
