'use client';

import { Clock, Plus, X } from 'lucide-react';
import { inputClass, inputStyle } from './branding-styles';

interface BusinessHour {
  day: string;
  hours: string;
}

interface BrandingBusinessHoursProps {
  hours: BusinessHour[];
  onAdd: () => void;
  onUpdate: (index: number, field: 'day' | 'hours', value: string) => void;
  onRemove: (index: number) => void;
}

export function BrandingBusinessHours({
  hours,
  onAdd,
  onUpdate,
  onRemove,
}: BrandingBusinessHoursProps) {
  return (
    <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={18} style={{ color: 'var(--brand-gold)' }} />
          <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
            Business Hours
          </h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: 'var(--brand-warm)', color: 'var(--brand-gold)' }}
        >
          <Plus size={12} className="inline" /> Add row
        </button>
      </div>
      <div className="space-y-2">
        {hours.map((entry, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={entry.day}
              onChange={(e) => onUpdate(i, 'day', e.target.value)}
              placeholder="Day"
              className={`${inputClass} flex-1`}
              style={inputStyle}
            />
            <input
              value={entry.hours}
              onChange={(e) => onUpdate(i, 'hours', e.target.value)}
              placeholder="Hours"
              className={`${inputClass} flex-1`}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(196,112,74,0.1)', color: 'var(--brand-terra)' }}
              aria-label="Remove row"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {hours.length === 0 && (
          <p className="text-xs italic" style={{ color: 'var(--brand-text-muted)' }}>
            No hours set — add at least one row.
          </p>
        )}
      </div>
    </div>
  );
}
