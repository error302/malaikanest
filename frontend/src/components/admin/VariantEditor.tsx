'use client';

import { Plus, Trash2 } from 'lucide-react';

export const COLOR_CHOICES: { value: string; label: string; hex: string }[] = [
  { value: 'white', label: 'White', hex: '#FFFFFF' },
  { value: 'black', label: 'Black', hex: '#1A1A1A' },
  { value: 'gray', label: 'Gray', hex: '#9CA3AF' },
  { value: 'pink', label: 'Pink', hex: '#F9A8D4' },
  { value: 'blue', label: 'Blue', hex: '#60A5FA' },
  { value: 'green', label: 'Green', hex: '#4ADE80' },
  { value: 'yellow', label: 'Yellow', hex: '#FDE047' },
  { value: 'red', label: 'Red', hex: '#F87171' },
  { value: 'purple', label: 'Purple', hex: '#C084FC' },
  { value: 'orange', label: 'Orange', hex: '#FB923C' },
  { value: 'brown', label: 'Brown', hex: '#A16207' },
  { value: 'beige', label: 'Beige', hex: '#E7D3B3' },
  { value: 'multi', label: 'Multi', hex: 'linear-gradient(90deg,#F87171,#FDE047,#60A5FA)' },
];

export const SIZE_CHOICES: { value: string; label: string }[] = [
  { value: 'newborn', label: 'Newborn' },
  { value: '0-3m', label: '0-3M' },
  { value: '3-6m', label: '3-6M' },
  { value: '6-12m', label: '6-12M' },
  { value: '1y', label: '1Y' },
  { value: '2y', label: '2Y' },
  { value: '3y', label: '3Y' },
  { value: '4y', label: '4Y' },
  { value: '5y', label: '5Y' },
  { value: '6y', label: '6Y' },
  { value: '7y', label: '7Y' },
  { value: '8y', label: '8Y' },
  { value: '9y', label: '9Y' },
  { value: '10y', label: '10Y' },
  { value: '11y', label: '11Y' },
  { value: '12y', label: '12Y' },
  { value: 'one-size', label: 'One Size' },
];

export interface VariantForm {
  id?: number;
  color: string;
  size: string;
  sku: string;
  price_modifier: string;
  stock: string;
  image_url?: string;
}

export function emptyVariant(): VariantForm {
  return { color: '', size: '', sku: '', price_modifier: '0', stock: '0', image_url: '' };
}

const inputClass = 'w-full rounded-lg px-3 py-2 text-sm focus:outline-none';
const inputStyle = { background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' } as const;

interface Props {
  variants: VariantForm[];
  onChange: (variants: VariantForm[]) => void;
}

export default function VariantEditor({ variants, onChange }: Props) {
  const update = (index: number, patch: Partial<VariantForm>) => {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };
  const remove = (index: number) => onChange(variants.filter((_, i) => i !== index));
  const add = () => onChange([...variants, emptyVariant()]);

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
        Add color / size variants (e.g. Blue · 0-3M). Each variant tracks its own stock. Leave empty for products without variants.
      </p>

      {variants.length > 0 && (
        <div className="space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-12 gap-2 items-end" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-bg-alt)' }}>
              <div className="sm:col-span-3">
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--brand-text-muted)' }}>Color *</label>
                <div className="flex items-center gap-2">
                  {v.color && (
                    <span className="w-5 h-5 rounded-full flex-shrink-0 border" style={{ background: COLOR_CHOICES.find((c) => c.value === v.color)?.hex, borderColor: 'var(--brand-border)' }} />
                  )}
                  <select value={v.color} onChange={(e) => update(i, { color: e.target.value })} className={inputClass} style={inputStyle}>
                    <option value="">— Select —</option>
                    {COLOR_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--brand-text-muted)' }}>Size</label>
                <select value={v.size} onChange={(e) => update(i, { size: e.target.value })} className={inputClass} style={inputStyle}>
                  <option value="">— None —</option>
                  {SIZE_CHOICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--brand-text-muted)' }}>Stock</label>
                <input type="number" min={0} value={v.stock} onChange={(e) => update(i, { stock: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--brand-text-muted)' }}>Price +/−</label>
                <input type="number" step="0.01" value={v.price_modifier} onChange={(e) => update(i, { price_modifier: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--brand-text-muted)' }}>SKU</label>
                <input value={v.sku} onChange={(e) => update(i, { sku: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: 'var(--brand-text-muted)' }}>Image URL (opt)</label>
                <input value={v.image_url || ''} onChange={(e) => update(i, { image_url: e.target.value })} placeholder="https://..." className={inputClass} style={inputStyle} />
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <button type="button" onClick={() => remove(i)} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(196,112,74,0.12)' }} aria-label="Remove variant">
                  <Trash2 size={15} style={{ color: 'var(--brand-terra)' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
        <Plus size={15} /> Add variant
      </button>
    </div>
  );
}
