"use client"
import Image from 'next/image'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text mb-4">About Malaika Nest</h1>
          <p className="text-xl text-gray-600">Premium Baby Products for Kenyan Families</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-secondary/50 mb-8">
          <h2 className="text-2xl font-semibold text-text mb-4">Our Story</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Malaika Nest was founded with a simple mission: to provide Kenyan parents with access to high-quality, 
            safe, and affordable baby products. We believe every child deserves the best start in life, and every 
            parent deserves support on their parenting journey.
          </p>
          <p className="text-gray-600 leading-relaxed">
            "Malaika" means angel in Swahili, and we treat every little one as the precious angel they are. 
            Our carefully curated selection of products ensures peace of mind for parents while bringing joy to babies.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary/50 text-center">
            <div className="w-16 h-16 bg-cta/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-text mb-2">Quality Assured</h3>
            <p className="text-sm text-gray-500">Every product is carefully selected and safety-certified</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary/50 text-center">
            <div className="w-16 h-16 bg-cta/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-text mb-2">Fair Pricing</h3>
            <p className="text-sm text-gray-500">Premium quality at prices Kenyan families can afford</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-secondary/50 text-center">
            <div className="w-16 h-16 bg-cta/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-text mb-2">Local Delivery</h3>
            <p className="text-sm text-gray-500">Fast delivery across Kenya, right to your doorstep</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-secondary/50">
          <h2 className="text-2xl font-semibold text-text mb-4">Why Choose Malaika Nest?</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Curated selection of trusted brands</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Secure M-Pesa payment options</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Delivery across Kenya</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Responsive customer support</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Gift wrapping available</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/categories" 
            className="inline-block px-8 py-3 bg-cta hover:bg-cta-hover text-white font-semibold rounded-lg transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
