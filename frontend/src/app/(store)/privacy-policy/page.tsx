import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Protection | Malaika Nest',
  description: 'Malaika Nest Privacy Policy under the Kenya Data Protection Act, 2019 (KDPA). How we safeguard customer, order, and payment data.',
  alternates: { canonical: 'https://malaikanest.com/privacy-policy' },
};

export default function PrivacyPage() {
  return (
    <div className="container-shell py-10 sm:py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3" style={{ background: 'rgba(139,105,20,0.1)' }}>
          <ShieldCheck size={14} style={{ color: 'var(--brand-gold)' }} />
          <span className="text-[11px] uppercase tracking-[0.16em] font-bold" style={{ color: 'var(--brand-gold)' }}>
            KDPA 2019 Compliant
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-3 tracking-tight" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Privacy Policy &amp; Data Protection
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>
          Malaika Nest is dedicated to protecting your family&apos;s personal information. This Privacy Policy outlines how your data is collected, processed, and safeguarded in full compliance with the <strong>Kenya Data Protection Act, 2019 (KDPA)</strong> and international e-commerce data standards.
        </p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>
        {/* Section 1: Data Controller */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            1. Data Controller Identification
          </h2>
          <p className="mb-2">
            The data controller responsible for the processing of your personal information collected via <strong>malaikanest.com</strong> is:
          </p>
          <div className="p-4 rounded-xl border mt-3 space-y-1" style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}>
            <p><strong>Malaika Nest Enterprises</strong></p>
            <p>Physical Location: Tawakal Toto Shop, Mombasa, Kenya</p>
            <p>Customer Support: <a href="tel:+254726771321" className="underline" style={{ color: 'var(--brand-gold)' }}>+254 726 771 321</a></p>
            <p>Data Privacy Inquiries: <a href="mailto:hello@malaikanest.com" className="underline" style={{ color: 'var(--brand-gold)' }}>hello@malaikanest.com</a></p>
          </div>
        </section>

        {/* Section 2: Categories of Data Collected */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            2. Personal Data We Collect
          </h2>
          <p className="mb-3">
            We collect only the minimum necessary personal data required to fulfill baby clothing orders, provide customer care, and prevent fraudulent transactions:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Identity &amp; Contact Data:</strong> Full name, telephone number, and email address.</li>
            <li><strong>Fulfillment &amp; Location Data:</strong> Physical delivery address, county, town, estate or apartment landmark, and optional delivery notes.</li>
            <li><strong>Transaction &amp; Payment Verification Data:</strong> M-Pesa transaction codes, receipt numbers, payment timestamps, order amounts, and payment status. <em>Note: We do not store full credit card numbers or M-Pesa PINs on our servers.</em></li>
            <li><strong>Technical &amp; Browsing Data:</strong> IP address, browser type, device information, and pages viewed, gathered via functional and security cookies.</li>
          </ul>
        </section>

        {/* Section 3: Lawful Basis for Processing under KDPA */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            3. Lawful Basis for Processing (Section 30, KDPA 2019)
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Performance of a Contract:</strong> Processing is required to prepare, package, and courier your clothing order to your specified address.</li>
            <li><strong>Legal &amp; Tax Obligations:</strong> Retaining financial transaction and receipt records to comply with the Kenya Revenue Authority (KRA) Tax Procedures Act (which mandates 5-year accounting record retention).</li>
            <li><strong>Legitimate Business Interests:</strong> Fraud detection, M-Pesa reversal mitigation, system troubleshooting, and security logging.</li>
            <li><strong>Consent:</strong> Sending promotional SMS or email newsletters (which you can opt out of at any time with one click).</li>
          </ul>
        </section>

        {/* Section 4: Authorized Third-Party Disclosures */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            4. Third-Party Service Providers &amp; Disclosures
          </h2>
          <p className="mb-3">
            Malaika Nest does not sell, rent, or lease customer data to third-party advertisers. Data is shared strictly with authorized operational partners:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Payment Gateways:</strong> Safaricom PLC (Lipa Na M-Pesa Till 3370347 and STK Push) and PayPal Inc. for secure payment clearance.</li>
            <li><strong>Couriers &amp; Logistics Partners:</strong> Registered courier partners (e.g. Fargo Courier, Speedaf Express, Wells Fargo, G4S, and local Mombasa riders) solely to deliver parcels and contact you upon arrival.</li>
            <li><strong>Communication Platforms:</strong> Brevo (SMTP relay for order receipts) and WhatsApp Business for direct customer service.</li>
            <li><strong>Law Enforcement &amp; Legal Compliance:</strong> In the event of fraudulent payment reversal, stolen card use, or lawful subpoena, records are provided to Safaricom Fraud Control and the Directorate of Criminal Investigations (DCI).</li>
          </ul>
        </section>

        {/* Section 5: Children's Privacy */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            5. Protection of Children&apos;s Privacy (Section 33, KDPA 2019)
          </h2>
          <p>
            Although our store specializes in newborn, baby, and children&apos;s apparel, our commercial services are directed exclusively at parents, guardians, and adults aged 18 and over. We do not knowingly collect personal data from minors. Any sizing information (e.g. child age or weight) entered to assist with sizing is treated strictly as order fulfillment parameters and is never used to profile or target children.
          </p>
        </section>

        {/* Section 6: Data Retention & Security */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            6. Data Security &amp; Retention Periods
          </h2>
          <p className="mb-2">
            All data in transit is encrypted using 256-bit Secure Sockets Layer (SSL) protocols. Access to customer order databases is restricted by role-based permissions and multi-factor authentication.
          </p>
          <p>
            Customer transaction records are maintained for a period of five (5) years in compliance with Kenya commercial and statutory tax laws. Non-transactional data is purged upon request or once no longer required for legitimate business purposes.
          </p>
        </section>

        {/* Section 7: Your Legal Rights */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            7. Your Legal Rights as a Data Subject
          </h2>
          <p className="mb-3">
            Under the Kenya Data Protection Act, 2019, you have the following enforceable rights:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Right to be informed:</strong> Understanding how your personal data is collected and used.</li>
            <li><strong>Right of access:</strong> Requesting a copy of personal information we hold about you.</li>
            <li><strong>Right to rectification:</strong> Requesting immediate correction of inaccurate or incomplete details.</li>
            <li><strong>Right to erasure (Right to be forgotten):</strong> Requesting deletion of personal data where retention is no longer legally mandated.</li>
            <li><strong>Right to object or restrict processing:</strong> Opting out of marketing communications at any time.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please email our team at <a href="mailto:hello@malaikanest.com" className="underline font-semibold" style={{ color: 'var(--brand-gold)' }}>hello@malaikanest.com</a>. We respond to all formal data subject requests within 21 calendar days.
          </p>
          <p className="mt-2 text-xs" style={{ color: 'var(--brand-text-muted)' }}>
            If you believe your data has been handled contrary to the law, you also have the statutory right to lodge a complaint with the <strong>Office of the Data Protection Commissioner of Kenya (ODPC)</strong> at <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="underline">www.odpc.go.ke</a>.
          </p>
        </section>

        {/* Section 8: Updates & Acceptance */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            8. Policy Modifications &amp; Inquiries
          </h2>
          <p className="mb-3">
            We reserve the right to revise this Privacy Policy periodically to reflect changes in our operational procedures or statutory requirements. Continued use of malaikanest.com constitutes your acceptance of the updated policy.
          </p>
          <p className="text-[11px]" style={{ color: 'var(--brand-text-muted)' }}>
            Last revised: September 2026 · Official Data Compliance Document for Malaika Nest
          </p>
        </section>
      </div>
    </div>
  );
}
