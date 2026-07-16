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
      acceptedAnswer: { '@type': 'Answer', text: 'We accept M-Pesa (Till 3370347), credit/debit cards (Visa & Mastercard), bank transfer, and cash on delivery within Mombasa. All online payments are secured by 256-bit SSL encryption.' },
    },
    {
      '@type': 'Question',
      name: 'Is delivery really free?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes — delivery is FREE for all orders above KES 3,000 within Kenya. Below that, a flat fee applies: KES 300 for Nairobi and KES 500 for upcountry. Mombasa delivery is always free.' },
    },
    {
      '@type': 'Question',
      name: 'What is your return policy?',
      acceptedAnswer: { '@type': 'Answer', text: 'We accept returns within 7 days of delivery for unused items in original packaging. Refunds are processed to your original payment method within 5–7 business days. Custom-made items are non-returnable.' },
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
    a: 'We accept M-Pesa (Till 3370347), credit/debit cards (Visa & Mastercard), bank transfer, and cash on delivery within Mombasa. All online payments are secured by 256-bit SSL encryption.',
  },
  {
    q: 'Is delivery really free?',
    a: 'Yes — delivery is FREE for all orders above KES 3,000 within Kenya. Below that, a flat fee applies: KES 300 for Nairobi and KES 500 for upcountry. Mombasa delivery is always free.',
  },
  {
    q: 'What is your return policy?',
    a: 'We accept returns within 7 days of delivery for unused items in original packaging. Refunds are processed to your original payment method within 5–7 business days. Custom-made items are non-returnable.',
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
