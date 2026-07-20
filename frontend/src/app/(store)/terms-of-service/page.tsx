import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <div className="container-shell py-10 sm:py-16 max-w-3xl">
      <h1 className="font-serif text-4xl font-semibold mb-6" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>Terms of Service</h1>
      <div className="prose prose-sm max-w-none space-y-4" style={{ color: 'var(--brand-text-secondary)' }}>
        <p>By accessing or using malaikanest.com, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use of the site.</p>
        <h2 className="font-serif text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--brand-text)' }}>Orders & Payments</h2>
        <p>All orders are subject to availability and confirmation of the order price. Prices are quoted in Kenyan Shillings (KES) and include applicable taxes. We reserve the right to refuse or cancel any order at our discretion.</p>
        <h2 className="font-serif text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--brand-text)' }}>Shipping & Delivery</h2>
        <p>Delivery timelines are estimates and not guaranteed. Risk of loss passes to you upon delivery. We are not liable for delays caused by third-party couriers or events beyond our control.</p>
        <h2 className="font-serif text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--brand-text)' }}>Returns</h2>
        <p>Returns are accepted within 7 days of delivery for unused items in original packaging. See our Returns page for full details.</p>
        <h2 className="font-serif text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--brand-text)' }}>Intellectual Property</h2>
        <p>All content on this site — including text, images, logos and designs — is the property of Malaika Nest and protected under Kenyan and international copyright law. You may not reproduce or distribute our content without written permission.</p>
        <h2 className="font-serif text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--brand-text)' }}>Governing Law</h2>
        <p>These terms are governed by the laws of the Republic of Kenya. Any disputes shall be resolved in the courts of Mombasa, Kenya.</p>
        <p className="text-xs pt-4" style={{ color: 'var(--brand-text-muted)' }}>Last updated: January 2026</p>
      </div>
    </div>
  );
}
