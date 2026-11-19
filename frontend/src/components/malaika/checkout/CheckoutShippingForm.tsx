'use client';

import type { DeliveryZone } from '@/lib/delivery';

interface ContactFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
}

interface CheckoutShippingFormProps {
  form: ContactFormState;
  onChange: (updates: Partial<ContactFormState>) => void;
  region: string;
  onRegionChange: (region: string) => void;
  zones: DeliveryZone[];
  t: (key: string) => string;
}

export function CheckoutShippingForm({
  form,
  onChange,
  region,
  onRegionChange,
  zones,
  t,
}: CheckoutShippingFormProps) {
  return (
    <section
      className="p-5 sm:p-6 rounded-2xl border"
      style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
    >
      <h2
        className="font-serif text-xl font-semibold mb-4"
        style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
      >
        {t('checkout.shippingAddress')}
      </h2>
      <div className="space-y-3">
        <input
          required
          placeholder={t('checkout.address')}
          value={form.address}
          onChange={(e) => onChange({ address: e.target.value })}
          className="input-warm w-full !pl-4"
          style={{ background: 'var(--brand-bg-alt)' }}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            required
            placeholder={t('checkout.city')}
            value={form.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="input-warm w-full !pl-4"
            style={{ background: 'var(--brand-bg-alt)' }}
          />
          <input
            placeholder={`${t('checkout.postal')} (${t('common.cancel') === 'Cancel' ? 'optional' : 'hiari'})`}
            value={form.postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value })}
            className="input-warm w-full !pl-4"
            style={{ background: 'var(--brand-bg-alt)' }}
          />
        </div>
        <select
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          required
          className="input-warm w-full !pl-4"
          style={{ background: 'var(--brand-bg-alt)' }}
          aria-label={t('checkout.shippingAddress')}
        >
          <option value="" disabled>{t('checkout.chooseDelivery') || 'Choose delivery option…'}</option>
          {zones.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name} — KES {Number(r.fee).toLocaleString('en-KE')}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Delivery instructions (optional — e.g. estate name, house/gate number, nearest landmark, call on arrival)"
          rows={2}
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="w-full rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/20 focus:border-[var(--brand-gold)]"
          style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
        />
      </div>
    </section>
  );
}
