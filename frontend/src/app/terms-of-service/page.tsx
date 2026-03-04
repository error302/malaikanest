export const metadata = {
  title: 'Terms of Service - Malaika Nest',
  description: 'Terms of Service for Malaika Nest - Premium Baby Products in Kenya',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-secondary/30 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <h1 className="text-3xl font-bold text-text mb-8">Terms of Service</h1>
        
        <div className="prose prose-brown max-w-none">
          <p className="text-gray-600 mb-6">Last updated: March 2026</p>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using Malaika Nest website, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">2. Products and Services</h2>
            <p className="text-gray-600 mb-4">
              Malaika Nest offers premium baby products for sale. All products are subject to availability. We reserve the right to modify prices, discontinue products, or change product specifications at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">3. Orders and Payment</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Orders are confirmed upon payment receipt</li>
              <li>We accept M-Pesa payments through Safaricom</li>
              <li>Payment must be received before order processing</li>
              <li>Orders will be cancelled if payment is not received within 24 hours</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">4. Delivery</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Delivery within Kenya only</li>
              <li>Delivery times are estimates and not guaranteed</li>
              <li>Delivery costs vary by location</li>
              <li>Risk of loss passes upon delivery to carrier</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">5. Returns and Refunds</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Returns accepted within 7 days of delivery</li>
              <li>Items must be unused and in original packaging</li>
              <li>Refunds processed within 14 business days</li>
              <li>Customer bears return shipping costs unless item is defective</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">6. Account Responsibilities</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>You are responsible for maintaining account confidentiality</li>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">7. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              All content on this website, including logos, images, text, and software, is the property of Malaika Nest and protected by Kenyan and international copyright laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              Malaika Nest shall not be liable for any indirect, incidental, or consequential damages arising from the use of this website or purchase of products.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">9. Governing Law</h2>
            <p className="text-gray-600 mb-4">
              These terms shall be governed by and construed in accordance with the laws of Kenya. Any disputes shall be resolved in Kenyan courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">10. Contact Information</h2>
            <p className="text-gray-600">
              For questions about these Terms of Service, please contact us:
              <br />
              <strong>Email:</strong> malaikanest7@gmail.com
              <br />
              <strong>Phone:</strong> +254 700 000 000
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
