'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, MapPin, Phone, AlertCircle } from 'lucide-react'
import api from '../../lib/api'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')

    try {
      await api.post('/api/core/contact/', formData)
      setSent(true)
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to send message. Please try whatsapping us on +254 726 771 321.'
      setError(detail)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="pb-20 pt-10">
        <div className="container-shell">
          <div className="card-soft mx-auto max-w-2xl p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-secondary)]">
              <Mail size={28} className="text-[var(--text-primary)]" />
            </div>
            <h1 className="font-display mt-5 text-[36px] text-[var(--text-primary)]">Message Sent!</h1>
            <p className="mt-3 text-[18px] text-[var(--text-secondary)]">
              Your message has been delivered to our team at{' '}
              <strong>malaikanest7@gmail.com</strong>. We will get back to you shortly.
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
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Your message goes directly to our email inbox.</p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Full Name *
                  <input name="name" value={formData.name} onChange={handleChange} className="input-soft mt-2" required placeholder="Jane Doe" />
                </label>
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Phone
                  <input name="phone" value={formData.phone} onChange={handleChange} className="input-soft mt-2" placeholder="+254 7XX XXX XXX" />
                </label>
              </div>

              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Email *
                <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-soft mt-2" required placeholder="you@example.com" />
              </label>

              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Subject *
                <input name="subject" value={formData.subject} onChange={handleChange} className="input-soft mt-2" required placeholder="e.g. Order inquiry" />
              </label>

              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Message *
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="input-soft mt-2 min-h-36 resize-y"
                  required
                  placeholder="Tell us how we can help..."
                />
              </label>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={sending}>
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </section>

          <aside className="space-y-4">
            <article className="card-soft p-6">
              <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Contact Information</h2>
              <ul className="mt-4 space-y-4 text-[var(--text-secondary)]">
                <li className="flex items-start gap-3"><Mail size={18} className="mt-0.5 shrink-0" /> malaikanest7@gmail.com</li>
                <li className="flex items-start gap-3"><Phone size={18} className="mt-0.5 shrink-0" /> +254 726 771 321</li>
                <li className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0" /> Mombasa, Kenya</li>
              </ul>
            </article>

            <article className="card-soft p-6">
              <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Business Hours</h2>
              <p className="mt-3 text-[var(--text-secondary)]">Mon – Sat: 8:00 AM – 6:00 PM</p>
            </article>

            <article className="card-soft p-6">
              <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">WhatsApp</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Prefer instant messaging?</p>
              <a
                href="https://wa.me/254726771321"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-3 inline-flex items-center gap-2"
              >
                Chat on WhatsApp
              </a>
            </article>
          </aside>
        </div>
      </div>
    </div>
  )
}
