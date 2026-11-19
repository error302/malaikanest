'use client';

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

interface CheckoutContactFormProps {
  form: ContactFormState;
  onChange: (updates: Partial<ContactFormState>) => void;
  t: (key: string) => string;
}

export function CheckoutContactForm({ form, onChange, t }: CheckoutContactFormProps) {
  return (
    <section
      className="p-5 sm:p-6 rounded-2xl border"
      style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}
    >
      <h2
        className="font-serif text-xl font-semibold mb-4"
        style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
      >
        {t('checkout.contact')}
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          required
          placeholder={t('checkout.firstName')}
          value={form.firstName}
          onChange={(e) => onChange({ firstName: e.target.value })}
          className="input-warm w-full !pl-4"
          style={{ background: 'var(--brand-bg-alt)' }}
        />
        <input
          required
          placeholder={t('checkout.lastName')}
          value={form.lastName}
          onChange={(e) => onChange({ lastName: e.target.value })}
          className="input-warm w-full !pl-4"
          style={{ background: 'var(--brand-bg-alt)' }}
        />
        <input
          required
          type="email"
          placeholder={t('checkout.email')}
          value={form.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className="input-warm w-full !pl-4"
          style={{ background: 'var(--brand-bg-alt)' }}
        />
        <input
          required
          type="tel"
          placeholder={t('checkout.phone')}
          value={form.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          className="input-warm w-full !pl-4"
          style={{ background: 'var(--brand-bg-alt)' }}
        />
      </div>
    </section>
  );
}
