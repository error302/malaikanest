'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSent(true)
    setSending(false)
  }

  if (sent) {
    return (
      <div className="pb-20 pt-10">
        <div className="container-shell">
          <div className="card-soft mx-auto max-w-2xl p-10 text-center">
            <h1 className="font-display text-[36px] text-[var(--text-primary)]">Message Sent</h1>
            <p className="mt-3 text-[18px] text-[var(--text-secondary)]">
              Thanks for reaching out. Our support team will contact you shortly.
            </p>
            <Link href="/" className="btn-primary mt-8 inline-flex px-7">Back Home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Support</p>
          <h1 className="font-display mt-3 text-[48px] text-[var(--text-primary)]">Contact Us</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[18px] text-[var(--text-secondary)]">Questions about products, delivery, or orders? We are here to help.</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <section className="card-soft p-6 md:p-8">
            <h2 className="text-[28px] font-semibold text-[var(--text-primary)]">Send a Message</h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Full Name
                  <input name="name" value={formData.name} onChange={handleChange} className="input-soft mt-2" required />
                </label>
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Phone
                  <input name="phone" value={formData.phone} onChange={handleChange} className="input-soft mt-2" />
                </label>
              </div>

              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Email
                <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-soft mt-2" required />
              </label>

              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Subject
                <input name="subject" value={formData.subject} onChange={handleChange} className="input-soft mt-2" required />
              </label>

              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Message
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="input-soft mt-2 min-h-36 resize-y"
                  required
                />
              </label>

              <button type="submit" className="btn-primary w-full" disabled={sending}>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </section>

          <aside className="space-y-4">
            <article className="card-soft p-6">
              <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Contact Information</h2>
              <ul className="mt-4 space-y-4 text-[var(--text-secondary)]">
                <li className="flex items-start gap-3"><Mail size={18} className="mt-0.5" /> support@malaikanest7@gmail.com</li>
                <li className="flex items-start gap-3"><Phone size={18} className="mt-0.5" /> +254 726 771 321</li>
                <li className="flex items-start gap-3"><MapPin size={18} className="mt-0.5" /> Mombasa, Kenya</li>
              </ul>
            </article>

            <article className="card-soft p-6">
              <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Business Hours</h2>
              <p className="mt-3 text-[var(--text-secondary)]">Mon - Sat: 8:00 AM - 6:00 PM</p>
            </article>
          </aside>
        </div>
      </div>
    </div>
  )
}
