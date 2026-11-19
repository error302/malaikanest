'use client';

import { MessageCircle } from 'lucide-react';
import { inputClass, inputStyle } from './branding-styles';

interface BrandingAnnouncementsProps {
  announcements: string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}

export function BrandingAnnouncements({
  announcements,
  onAdd,
  onUpdate,
  onRemove,
}: BrandingAnnouncementsProps) {
  return (
    <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} style={{ color: 'var(--brand-gold)' }} />
          <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
            Announcement Bar
          </h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: 'var(--brand-warm)', color: 'var(--brand-gold)' }}
        >
          + Add message
        </button>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--brand-text-muted)' }}>
        Messages rotate every 4.5s in the top bar. HTML allowed (e.g. &lt;strong&gt;).
      </p>
      <div className="space-y-2">
        {announcements.map((msg, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={msg}
              onChange={(e) => onUpdate(i, e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(196,112,74,0.1)', color: 'var(--brand-terra)' }}
              aria-label="Remove message"
            >
              ×
            </button>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-xs italic" style={{ color: 'var(--brand-text-muted)' }}>
            No messages — bar will be hidden.
          </p>
        )}
      </div>
    </div>
  );
}
