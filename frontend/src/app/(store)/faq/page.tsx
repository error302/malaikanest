import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about orders, delivery, payments and returns at Malaika Nest.',
  alternates: { canonical: `${SITE_URL}/faq` },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How long does delivery take?',
      acceptedAnswer: { '@type': 'Answer', text: 'Same-day delivery within Mombasa for orders placed before 11am. Nairobi: 1–2 business days. Upcountry: 2–3 business days. You\'ll receive a tracking number once your order ships.' },
    },
    {
      '@type': 'Question',
      name: 'What payment methods do you accept?',
      acceptedAnswer: { '@type': 'Answer', text: 'We accept M-Pesa (Till 3370347 & instant STK push), PayPal, credit/debit cards (Visa & Mastercard), and Pesapal. Pay securely online or via M-Pesa Till before dispatch. All transactions are protected with 256-bit SSL encryption.' },
    },
    {
      '@type': 'Question',
      name: 'Is delivery really free?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes — delivery is FREE for all qualifying orders of KES 10,000 and above across Kenya. For orders under KES 10,000, standard regional courier rates apply (Mombasa KES 250, Nairobi KES 300, and upcountry KES 500). Workshop pick-up in Mombasa is always free.' },
    },
    {
      '@type': 'Question',
      name: 'What is your return policy?',
      acceptedAnswer: { '@type': 'Answer', text: 'Malaika Nest enforces a strict 72-hour return and exchange policy. Requests must be submitted within 72 hours of delivery. All returned clothing must be unworn, unwashed, and have original brand tags attached and untampered. Customer covers return courier fees. Hygiene items (underwear, bottles, pacifiers) and thrifted items are final sale.' },
    },
    {
      '@type': 'Question',
      name: 'Are your products safe for newborns?',
      acceptedAnswer: { '@type': 'Answer', text: 'Absolutely. All our organic cotton is OEKO-TEX certified, free from harmful chemicals and dyes. We test every batch for skin safety and our workshop follows strict hygiene protocols.' },
    },
    {
      '@type': 'Question',
      name: 'Can I track my order?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Once your order ships, you\'ll receive an SMS and email with a tracking number. You can also view all your orders and their status in your account under "My Orders".' },
    },
    {
      '@type': 'Question',
      name: 'Do you offer gift wrapping?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes! We offer complimentary gift wrapping on all gift sets. You can also add a personalised gift message at checkout — perfect for baby showers and newborn gifts.' },
    },
    {
      '@type': 'Question',
      name: 'How do I care for organic cotton?',
      acceptedAnswer: { '@type': 'Answer', text: 'Machine wash cold with like colours, tumble dry low or hang to dry. Avoid bleach and fabric softeners — they break down organic fibres. Iron on low if needed.' },
    },
  ],
};

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Same-day delivery within Mombasa for orders placed before 11am. Nairobi: 1–2 business days. Upcountry: 2–3 business days. You\'ll receive a tracking number once your order ships.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept M-Pesa (Till 3370347 & instant STK push), PayPal, credit/debit cards (Visa & Mastercard), and Pesapal. Pay securely online or via M-Pesa Till before dispatch. All transactions are protected with 256-bit SSL encryption.',
  },
  {
    q: 'Is delivery really free?',
    a: 'Yes — delivery is FREE for all qualifying orders of KES 10,000 and above across Kenya. Below that, standard regional courier rates apply (Mombasa KES 250, Nairobi KES 300, and upcountry KES 500). Workshop pick-up in Mombasa is always free.',
  },
  {
    q: 'What is your return policy?',
    a: 'Malaika Nest enforces a strict 72-hour return and exchange policy. Sizing exchange requests must be submitted within 72 hours of delivery. All garments must be unworn, unwashed, and have original brand tags firmly attached and untampered. Customer covers return shipping. Hygiene items (underwear, bottles, pacifiers) and thrifted items are final sale.',
  },
  {
    q: 'Are your products safe for newborns?',
    a: 'Absolutely. All our organic cotton is OEKO-TEX certified, free from harmful chemicals and dyes. We test every batch for skin safety and our workshop follows strict hygiene protocols.',
  },
  {
    q: 'Can I track my order?',
    a: 'Yes. Once your order ships, you\'ll receive an SMS and email with a tracking number. You can also view all your orders and their status in your account under "My Orders".',
  },
  {
    q: 'Do you offer gift wrapping?',
    a: 'Yes! We offer complimentary gift wrapping on all gift sets. You can also add a personalised gift message at checkout — perfect for baby showers and newborn gifts.',
  },
  {
    q: 'How do I care for organic cotton?',
    a: 'Machine wash cold with like colours, tumble dry low or hang to dry. Avoid bleach and fabric softeners — they break down organic fibres. Iron on low if needed.',
  },
];

export default function FAQPage() {
  return (
    <div className="container-shell py-10 sm:py-16 max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Frequently Asked Questions
        </h1>
        <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
          Everything you need to know about shopping with Malaika Nest.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <details key={i} className="p-5 rounded-2xl border group" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <summary className="font-medium cursor-pointer list-none flex items-center justify-between" style={{ color: 'var(--brand-text)' }}>
              {faq.q}
              <span className="text-xl transition-transform group-open:rotate-45" style={{ color: 'var(--brand-gold)' }}>+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
