"use client"

import { useState } from 'react'

type FAQItem = {
  question: string
  answer: string
}

const faqCategories: Array<{ title: string; items: FAQItem[] }> = [
  {
    title: 'Orders & Shopping',
    items: [
      {
        question: 'How do I place an order?',
        answer:
          'Browse products, add items to cart, and proceed to checkout. You can complete your purchase after account login and M-Pesa confirmation.',
      },
      {
        question: 'Can I modify or cancel my order?',
        answer:
          'Yes, before fulfillment starts. Contact support with your order number as soon as possible and we will assist.',
      },
      {
        question: 'How do I track my order?',
        answer:
          'You can track status from your account order history, and we also share delivery updates through phone or email.',
      },
      {
        question: 'Do you offer gift wrapping?',
        answer:
          'Yes. During checkout, mark your order as a gift and optionally include a personal message.',
      },
    ],
  },
  {
    title: 'Payments',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We currently support M-Pesa STK Push payments for secure and convenient checkout in Kenya.',
      },
      {
        question: 'Is payment secure?',
        answer:
          'Yes. Payment authorization is handled through Safaricom channels and we do not store your M-Pesa PIN.',
      },
      {
        question: 'Will I receive confirmation?',
        answer:
          'Yes. You receive an M-Pesa confirmation and an order confirmation from Malaika Nest.',
      },
    ],
  },
  {
    title: 'Delivery',
    items: [
      {
        question: 'Where do you deliver?',
        answer: 'We deliver across Kenya including Mombasa, Nairobi, and upcountry regions.',
      },
      {
        question: 'How long does delivery take?',
        answer: 'Mombasa and Nairobi typically 1-2 business days. Upcountry generally 3-5 business days.',
      },
      {
        question: 'Can I request delivery instructions?',
        answer:
          'Yes. Add your delivery notes during checkout and our team will coordinate with you before dispatch.',
      },
    ],
  },
  {
    title: 'Product Support',
    items: [
      {
        question: 'What if I receive a damaged or wrong item?',
        answer:
          'Contact support immediately with your order number and product photos. We prioritize resolution quickly.',
      },
      {
        question: 'How do I choose the right size?',
        answer:
          'Product pages include sizing guidance where relevant. If unsure, contact support before ordering.',
      },
      {
        question: 'Do you support wholesale or bulk orders?',
        answer: 'Yes. Reach out through our contact page for wholesale and bulk pricing support.',
      },
    ],
  },
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const toggle = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Support</p>
          <h1 className="font-display mt-3 text-[48px] text-[var(--text-primary)]">Frequently Asked Questions</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[18px] text-[var(--text-secondary)]">
            Clear answers on orders, payments, delivery, and customer support.
          </p>
        </header>

        <div className="space-y-6">
          {faqCategories.map((category, catIndex) => (
            <section key={category.title} className="card-soft overflow-hidden">
              <div className="border-b border-default bg-[var(--bg-soft)] px-5 py-4 md:px-6">
                <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">{category.title}</h2>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {category.items.map((item, itemIndex) => {
                  const key = `${catIndex}-${itemIndex}`
                  const isOpen = openItems[key]
                  return (
                    <article key={item.question}>
                      <button
                        onClick={() => toggle(key)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-soft)] md:px-6"
                      >
                        <span className="font-medium">{item.question}</span>
                        <span className={`text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                          ▾
                        </span>
                      </button>
                      <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                          <p className="px-5 pb-4 text-[16px] text-[var(--text-secondary)] md:px-6">{item.answer}</p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <section className="card-soft mt-10 p-8 text-center">
          <h2 className="text-[28px] font-semibold text-[var(--text-primary)]">Need direct support?</h2>
          <p className="mt-2 text-[18px] text-[var(--text-secondary)]">
            Reach the team for order help, product guidance, or delivery coordination.
          </p>
          <a href="/contact" className="btn-primary mt-6 inline-flex px-7">
            Contact Support
          </a>
        </section>
      </div>
    </div>
  )
}
