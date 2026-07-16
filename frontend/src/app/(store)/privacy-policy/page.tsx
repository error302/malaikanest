import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="container-shell py-10 sm:py-16 max-w-3xl">
      <h1 className="font-serif text-4xl font-semibold mb-6" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>Privacy Policy</h1>
      <div className="prose prose-sm max-w-none space-y-4" style={{ color: 'var(--brand-text-secondary)' }}>
        <p>Malaika Nest (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This policy explains how we collect, use and safeguard your personal information when you visit malaikanest.com or purchase from our store.</p>
        <h2 className="font-serif text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--brand-text)' }}>Information We Collect</h2>
        <p>We collect your name, email, phone number, shipping address and payment details when you place an order. We also collect browsing data (pages visited, time on site) via cookies to improve your shopping experience.</p>
        <h2 className="font-serif text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--brand-text)' }}>How We Use Your Information</h2>
        <p>Your information is used to process orders, deliver products, send order updates, provide customer support and (with your consent) send marketing communications. We never sell your data to third parties.</p>
        <h2 className="font-serif text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--brand-text)' }}>Data Security</h2>
        <p>All payment information is encrypted using 256-bit SSL and processed by PCI-compliant providers. We do not store full card numbers on our servers. M-Pesa payments are processed directly by Safaricom.</p>
        <h2 className="font-serif text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--brand-text)' }}>Your Rights</h2>
        <p>You have the right to access, correct or delete your personal data at any time. To exercise these rights, email malaikanest7@gmail.com. We respond to all requests within 30 days.</p>
        <p className="text-xs pt-4" style={{ color: 'var(--brand-text-muted)' }}>Last updated: January 2026</p>
      </div>
    </div>
  );
}
