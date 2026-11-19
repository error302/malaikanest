import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Malaika Nest',
  description: 'Official terms and conditions for orders, payments, delivery, infant safety, and returns at Malaika Nest Kenya.',
  alternates: { canonical: 'https://malaikanest.com/terms-of-service' },
};

export default function TermsPage() {
  return (
    <div className="container-shell py-10 sm:py-16 max-w-4xl">
      <div className="text-center mb-10 sm:mb-12">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-3 tracking-tight" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Terms of Service
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--brand-text-secondary)' }}>
          Please read these terms and conditions carefully before placing an order on Malaika Nest. By accessing our platform, placing an order, or purchasing our products, you enter into a legally binding contract governed by the laws of Kenya.
        </p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--brand-text-secondary)' }}>
        {/* Section 1 */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            1. Overview &amp; Electronic Contracting
          </h2>
          <p className="mb-3">
            Malaika Nest operates the e-commerce website at <strong>malaikanest.com</strong> and our retail workshop at <strong>Tawakal Toto Shop, Mombasa, Kenya</strong>.
          </p>
          <p>
            Pursuant to the <strong>Kenya Information and Communications Act (KICA), 1998</strong> (Section 83B regarding electronic transactions) and the <strong>Consumer Protection Act, 2012</strong>, your electronic submission of an order and completion of payment constitutes a legally valid and binding agreement to these Terms of Service, our <Link href="/returns" className="underline font-semibold" style={{ color: 'var(--brand-gold)' }}>Return Policy</Link>, and our <Link href="/privacy-policy" className="underline font-semibold" style={{ color: 'var(--brand-gold)' }}>Privacy Policy</Link>.
          </p>
        </section>

        {/* Section 2 */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            2. Orders, Sizing Responsibility &amp; Pricing
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Currency &amp; Taxes:</strong> All prices are displayed in Kenyan Shillings (KES) and include applicable statutory taxes. We reserve the right to modify prices without prior notice.
            </li>
            <li>
              <strong>Sizing Verification Responsibility:</strong> Detailed size charts (specifying child age, height in cm, and weight in kg) are provided on every product page. The customer is solely responsible for verifying the child&apos;s measurements prior to completing an order. Malaika Nest does not cover return courier expenses incurred due to customer selection of an incorrect size.
            </li>
            <li>
              <strong>Order Right of Refusal:</strong> We reserve the right to restrict, hold, or cancel any order placed with suspected fraudulent payment, unauthorized credit card use, unreachable telephone contacts, or incomplete delivery addresses.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            3. Payment Terms &amp; M-Pesa Fraud Mitigation
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Advance Payment Policy:</strong> To protect our workshop, inventory, and logistics chain from commercial loss, all orders must be paid in full prior to package dispatch. We accept M-Pesa (Buy Goods Till 3370347 and STK Push), PayPal, and major debit/credit cards (Visa &amp; Mastercard). We do not offer cash-on-delivery.
            </li>
            <li>
              <strong>Manual Till Verification:</strong> For payments made via Buy Goods Till 3370347, parcels will only be released once our accounting staff has confirmed the 10-character M-Pesa transaction reference in our official Safaricom statement.
            </li>
            <li>
              <strong>Criminal Liability for Reversals:</strong> Any attempt to reverse an M-Pesa transaction after a parcel has been handed over to the courier constitutes obtaining goods by false pretences under Section 313 of the Penal Code of Kenya and a violation of the <strong>Computer Misuse and Cybercrimes Act, 2018</strong>. Malaika Nest will immediately forward the customer&apos;s phone number, ID, and address to Safaricom Fraud Control and the Directorate of Criminal Investigations (DCI) for arrest and prosecution.
            </li>
            <li>
              <strong>Chargeback Indemnification:</strong> In the event a customer initiates a false chargeback or payment dispute through PayPal or a card issuer after goods have been delivered via courier or collected in-person, the customer agrees to indemnify Malaika Nest for the full order amount, all associated bank chargeback penalties, and reasonable legal costs incurred in debt recovery.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            4. Shipping, Delivery &amp; Free Delivery Threshold
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Free Delivery Threshold:</strong> Free delivery applies strictly and exclusively to orders with a merchandise subtotal of <strong>KES 10,000 and above</strong>. For all orders under KES 10,000, regional delivery fees are charged at checkout based on destination.
            </li>
            <li>
              <strong>Transfer of Transit Risk:</strong> Delivery times are non-binding estimates provided by independent couriers (e.g. Fargo Courier, Speedaf, Wells Fargo, G4S). Risk of transit passes to the customer once the sealed parcel is handed over to the courier. Customers must ensure their telephone number is active to receive the dispatch call.
            </li>
            <li>
              <strong>Non-Refundable Courier Fees:</strong> Once an order has been collected by the courier service, shipping fees are 100% non-refundable under all circumstances.
            </li>
          </ul>
        </section>

        {/* Section 5: Strict 72-Hour Return & Exchange Policy */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            5. Strict 72-Hour Return &amp; Exchange Policy
          </h2>
          <div className="p-4 rounded-xl border mb-3" style={{ background: 'rgba(196,112,74,0.06)', borderColor: 'var(--brand-terra)' }}>
            <p className="font-semibold text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--brand-terra)' }}>
              Non-Negotiable Merchant Protection Rules:
            </p>
            <p className="text-xs">
              Malaika Nest enforces a strict 72-hour policy to eliminate return abuse, wardrobing, and health risks associated with infant goods.
            </p>
          </div>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>72-Hour Time Limit:</strong> Return or exchange requests must be formally submitted within <strong>72 hours (3 calendar days)</strong> of confirmed delivery or physical collection. Any claim raised after 72 hours will be permanently rejected.
            </li>
            <li>
              <strong>Mandatory Attached Tag:</strong> If the product was purchased new, the <strong>original factory and store tags must remain attached, untampered, and uncut</strong>. If the tag has been removed, torn off, re-attached, or missing, the item is strictly ineligible for return.
            </li>
            <li>
              <strong>Condition of Garments:</strong> Items must be completely unworn (not used for photoshoots, parties, or outings), unwashed, free of stains, scents (baby lotions, powders, perfumes, smoke), and in original packaging.
            </li>
            <li>
              <strong>Final Sale &amp; Hygiene Exclusions:</strong> No returns or exchanges are permitted for underwear, socks, layette intimates, feeding accessories (bottles, pacifiers, teats), teethers, bath products, personalized items, or thrifted/mtumba items.
            </li>
            <li>
              <strong>Shipping Costs for Returns:</strong> The customer bears 100% of all courier expenses for returning the item to our Mombasa workshop, as well as redelivery shipping fees for replacement sizes.
            </li>
            <li>
              <strong>Form of Compensation:</strong> Approved returns are compensated solely via <strong>Store Credit (valid for 6 months)</strong> or direct item replacement. Cash refunds are not provided for change of mind or buyer sizing mistakes.
            </li>
          </ul>
        </section>

        {/* Section 6: Infant Safety & Choking Hazard Warnings (Critical Legal Shield) */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} style={{ color: 'var(--brand-gold)' }} />
            <h2 className="font-serif text-xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              6. Infant Product Safety, Safe Sleep &amp; Choking Disclaimers
            </h2>
          </div>
          <ul className="space-y-2.5 list-disc list-inside">
            <li>
              <strong>Parental &amp; Caregiver Supervision:</strong> All baby and children&apos;s apparel, rompers, hairbands, hats, bows, bibs, and accessories must be worn strictly under competent adult supervision.
            </li>
            <li>
              <strong>Safe Sleep &amp; SIDS Precautions:</strong> To reduce the risk of Sudden Infant Death Syndrome (SIDS) and accidental strangulation or suffocation, <strong>never leave headbands, hair accessories, hats, or bibs on an infant while they are sleeping or unattended</strong>. Loose accessories must be removed immediately prior to naptime or bedtime.
            </li>
            <li>
              <strong>Choking Hazard Inspection:</strong> Small components such as snaps, buttons, ribbons, and decorative bows are securely fastened during production. However, parents and guardians must inspect all fasteners before each dressing session to verify they remain intact. Discontinue use immediately if any component becomes loose.
            </li>
            <li>
              <strong>Fabric Care &amp; Sensitive Skin:</strong> While our organic cotton is OEKO-TEX certified and free from harmful chemicals, every baby&apos;s skin barrier is unique. We recommend that parents launder new garments with hypoallergenic, fragrance-free baby detergent prior to first wear. Malaika Nest disclaims liability for allergic skin sensitivities or contact dermatitis.
            </li>
          </ul>
        </section>

        {/* Section 7: Thrifted / Mitumba Collection & Trademark Disclaimers */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            7. Thrifted (Mtumba) Collection &amp; Trademark Disclaimers
          </h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Pre-Loved &ldquo;AS-IS&rdquo; Sales:</strong> All thrifted (mtumba) items are authenticated pre-owned pieces inspected and graded for quality. They are sold strictly <strong>&ldquo;AS-IS&rdquo; as Final Sale merchandise</strong> with zero warranties, returns, or refunds.
            </li>
            <li>
              <strong>Trademark Non-Affiliation:</strong> Any third-party brand names, logos, or designer trademarks (e.g. Carter&apos;s, Gap, Zara, H&amp;M, etc.) displayed in the Thrifted section are the exclusive property of their respective trademark proprietors. Malaika Nest is an independent reseller of genuine pre-owned clothing under the doctrine of exhaustion of trademark rights and is not affiliated with, sponsored by, or endorsed by these brand manufacturers.
            </li>
            <li>
              <strong>Hygiene Laundering Notice:</strong> While all thrifted garments are steamed and cleaned, customers are required to wash second-hand apparel thoroughly prior to dressing their children.
            </li>
          </ul>
        </section>

        {/* Section 8: Intellectual Property */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            8. Intellectual Property &amp; Brand Assets
          </h2>
          <p>
            All original designs, patterns, studio photography, product copy, branding, logos, and digital code published on malaikanest.com are the exclusive intellectual property of Malaika Nest Enterprises and protected under the <strong>Copyright Act of Kenya</strong>. Unauthorized reproduction, web scraping, or commercial exploitation is strictly actionable by law.
          </p>
        </section>

        {/* Section 9: Governing Law & Jurisdiction */}
        <section className="p-6 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            9. Governing Law, Force Majeure &amp; Jurisdiction
          </h2>
          <p className="mb-2">
            These Terms of Service and all related transactions are governed by the statutory laws of the <strong>Republic of Kenya</strong>. We shall not be held liable for failure or delay in performance resulting from acts of God, extreme coastal weather, transport strikes, Likoni ferry disruptions, or nationwide telecommunication outages.
          </p>
          <p>
            Any disputes, controversies, or claims arising out of or relating to these terms shall be resolved exclusively through the competent commercial courts located in <strong>Mombasa, Kenya</strong>.
          </p>
          <div className="pt-4 mt-4 border-t text-[11px]" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text-muted)' }}>
            Last revised: September 2026 · Official Legal Terms of Service for Malaika Nest Enterprises
          </div>
        </section>
      </div>
    </div>
  );
}
