'use client';

import { useEffect, useState } from 'react';

interface AnnouncementBarProps {
  messages?: string[];
}

export function AnnouncementBar({ messages = [] }: AnnouncementBarProps) {
  const [index, setIndex] = useState(0);

  const defaultMessages = [
    '🚚 <strong>Same-Day Delivery in Mombasa</strong> · 1–3 Days Across Kenya',
    '💚 <strong>Lipa Na M-Pesa Accepted</strong> · Till 3370347',
    '✨ Handcrafted Organic Baby Clothing & Premium Essentials',
    '📲 <strong>Order via WhatsApp:</strong> <a href="https://wa.me/254726771321" target="_blank" rel="noopener noreferrer" class="underline hover:text-amber-100">+254 726 771 321</a>',
  ];

  const displayList = messages && messages.length > 0 ? messages : defaultMessages;

  useEffect(() => {
    if (displayList.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % displayList.length);
    }, 4000);
    return () => clearInterval(t);
  }, [displayList.length]);

  return (
    <div
      className="relative z-[60] overflow-hidden text-center text-[11px] sm:text-xs py-2.5 px-4 font-medium tracking-wide"
      style={{
        background: 'var(--brand-brown-dark)',
        color: '#FFFFFF',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        key={index}
        className="animate-fade-in-up inline-flex items-center gap-2"
      >
        <span dangerouslySetInnerHTML={{ __html: displayList[index] || displayList[0] }} />
      </div>
    </div>
  );
}
