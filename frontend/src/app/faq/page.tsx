"use client"
import { useState } from 'react'

type FAQItem = {
  question: string
  answer: string
}

const faqCategories = [
  {
    title: 'Orders & Shopping',
    items: [
      {
        question: 'How do I place an order?',
        answer: 'Browse our products, add items to your cart, and proceed to checkout. You\'ll need to create an account or sign in to complete your purchase. We accept M-Pesa payments for convenient checkout.'
      },
      {
        question: 'Can I modify or cancel my order?',
        answer: 'You can modify or cancel your order as long as it hasn\'t been processed for delivery. Please contact our support team immediately with your order number.'
      },
      {
        question: 'How do I track my order?',
        answer: 'Once your order is shipped, you\'ll receive an SMS with tracking information. You can also log into your account and view order status under "My Orders".'
      },
      {
        question: 'Do you offer gift wrapping?',
        answer: 'Yes! During checkout, you can mark your order as a gift and include a personalized message. We\'ll beautifully wrap your items.'
      }
    ]
  },
  {
    title: 'Payments',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept M-Pesa payments through Safaricom\'s STK Push service. This is the most convenient and secure way to pay for Kenyan customers.'
      },
      {
        question: 'Is it safe to pay with M-Pesa?',
        answer: 'Yes, absolutely. We use secure M-Pesa integration and never store your M-Pesa PIN or credentials. Payments are processed directly through Safaricom.'
      },
      {
        question: 'Will I receive a payment receipt?',
        answer: 'Yes, you\'ll receive an M-Pesa confirmation message from Safaricom, and we\'ll send you an email confirmation of your order.'
      }
    ]
  },
  {
    title: 'Delivery',
    items: [
      {
        question: 'Where do you deliver?',
        answer: 'We deliver throughout Kenya. Nairobi deliveries are free. Upcountry deliveries have a Ksh 500 shipping fee.'
      },
      {
        question: 'How long does delivery take?',
        answer: 'Nairobi: 1-2 business days. Upcountry: 3-5 business days depending on location.'
      },
      {
        question: 'How much does delivery cost?',
        answer: 'Nairobi deliveries are FREE. Upcountry deliveries cost Ksh 500 per order.'
      },
      {
        question: 'Can I specify a delivery time?',
        answer: 'While we cannot guarantee specific time slots, you can add delivery instructions during checkout and our delivery team will contact you.'
      }
    ]
  },
  {
    title: 'Returns & Refunds',
    items: [
      {
        question: 'What is your return policy?',
        answer: 'We accept returns within 7 days of delivery for unused items in original packaging. Contact us first to initiate a return.'
      },
      {
        question: 'Who pays for return shipping?',
        answer: 'Customers are responsible for return shipping costs unless the item is defective or we made an error.'
      },
      {
        question: 'How long do refunds take?',
        answer: 'Once we receive and inspect your return, refunds are processed within 5-7 business days. M-Pesa refunds reflect within 1-2 business days.'
      }
    ]
  },
  {
    title: 'Products & Sizing',
    items: [
      {
        question: 'How do I know what size to buy?',
        answer: 'Each product page includes a size guide. For clothing, we recommend checking age recommendations and measurements.'
      },
      {
        question: 'Are your products safe for babies?',
        answer: 'All our products meet safety standards. We carefully curate trusted brands and conduct quality checks.'
      },
      {
        question: 'Do you offer wholesale or bulk orders?',
        answer: 'Yes, we offer wholesale pricing for retailers and bulk orders. Contact our business team for inquiries.'
      }
    ]
  }
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const toggle = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="min-h-screen bg-secondary/20 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600">Find answers to common questions</p>
        </div>

        <div className="space-y-8">
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex} className="bg-white rounded-2xl shadow-sm border border-secondary/50 overflow-hidden">
              <div className="px-6 py-4 bg-cta/5 border-b border-secondary">
                <h2 className="text-xl font-semibold text-text">{category.title}</h2>
              </div>
              <div className="divide-y divide-secondary">
                {category.items.map((item, itemIndex) => {
                  const key = `${catIndex}-${itemIndex}`
                  const isOpen = openItems[key]
                  return (
                    <div key={itemIndex}>
                      <button
                        onClick={() => toggle(key)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-secondary/20 transition-colors"
                      >
                        <span className="font-medium text-text">{item.question}</span>
                        <svg 
                          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div 
                        className={`overflow-hidden transition-all duration-300 ${
                          isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-6 pb-4 text-gray-600">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-secondary/50 text-center">
          <h2 className="text-xl font-semibold text-text mb-2">Still have questions?</h2>
          <p className="text-gray-600 mb-6">Can't find the answer you're looking for? Our team is here to help.</p>
          <a 
            href="/contact" 
            className="inline-block px-6 py-3 bg-cta hover:bg-cta-hover text-white font-semibold rounded-lg transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}
