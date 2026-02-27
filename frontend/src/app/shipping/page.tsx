"use client"
import Link from 'next/link'

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text mb-4">Shipping & Delivery</h1>
          <p className="text-xl text-gray-600">Delivery information for Kenyan families</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-secondary/50 mb-8">
          <h2 className="text-2xl font-semibold text-text mb-6">Delivery Areas & Costs</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-text">Mombasa</h3>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">FREE</div>
              <p className="text-sm text-gray-600">Free delivery within Mombasa CBD and suburbs</p>
              <div className="mt-4 text-sm text-gray-500">Delivery time: Same day</div>
            </div>

            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-text">Nairobi</h3>
              </div>
              <div className="text-3xl font-bold text-amber-600 mb-2">KSh 500</div>
              <p className="text-sm text-gray-600">Per order delivery to other regions</p>
              <div className="mt-4 text-sm text-gray-500">Delivery time: 3-5 business days</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-secondary/50 mb-8">
          <h2 className="text-2xl font-semibold text-text mb-6">Delivery Process</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-cta rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">1</div>
              <div>
                <h3 className="font-semibold text-text mb-1">Order Confirmation</h3>
                <p className="text-gray-600 text-sm">You'll receive an SMS and email confirmation once your order is placed successfully.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-cta rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">2</div>
              <div>
                <h3 className="font-semibold text-text mb-1">Payment Processing</h3>
                <p className="text-gray-600 text-sm">Once you complete M-Pesa payment, your order will be processed within 24 hours.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-cta rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">3</div>
              <div>
                <h3 className="font-semibold text-text mb-1">Order Shipped</h3>
                <p className="text-gray-600 text-sm">We'll notify you when your order is dispatched with tracking details.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-cta rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">4</div>
              <div>
                <h3 className="font-semibold text-text mb-1">Delivery</h3>
                <p className="text-gray-600 text-sm">Our delivery partner will contact you to confirm delivery. For Nairobi, expect delivery within 1-2 days.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-secondary/50 mb-8">
          <h2 className="text-2xl font-semibold text-text mb-6">Delivery Instructions</h2>
          
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cta mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="font-medium text-text">Provide accurate delivery details</span>
                <p className="text-sm text-gray-500">Ensure your address and phone number are correct for smooth delivery</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cta mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="font-medium text-text">Be available for delivery</span>
                <p className="text-sm text-gray-500">Our driver will call you before arrival. Please be reachable at the phone number provided.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cta mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="font-medium text-text">Business deliveries</span>
                <p className="text-sm text-gray-500">For office deliveries, ensure someone is available to receive the package during working hours.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cta mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="font-medium text-text">Gift orders</span>
                <p className="text-sm text-gray-500">If sending as a gift, the recipient will be notified but no pricing information will be included.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-secondary/50">
          <h2 className="text-2xl font-semibold text-text mb-6">Tracking Your Order</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Once your order is dispatched, you'll receive an SMS with tracking information. You can also:
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-cta flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-gray-600">Log into your account to view order status</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-cta flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">Contact our support team for assistance</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-cta flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-600">Call us for real-time updates</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Have questions about delivery?</p>
          <Link 
            href="/contact" 
            className="inline-block px-6 py-3 bg-cta hover:bg-cta-hover text-white font-semibold rounded-lg transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
