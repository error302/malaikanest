'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/api/v1/core/contact/', form);
      setSent(true);
      showToast('Message sent! We will reply within 24 hours.', 'success');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to send message. Please try WhatsApp.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-shell py-10 sm:py-16 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Get in touch
        </h1>
        <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
          We&apos;d love to hear from you. Reach us on any channel below.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {[
          { Icon: Mail, label: 'Email', value: 'hello@malaikanest.com', href: 'mailto:hello@malaikanest.com' },
          { Icon: Phone, label: 'Phone', value: '+254 726 771 321', href: 'tel:+254726771321' },
          { Icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us', href: 'https://wa.me/254726771321' },
          { Icon: MapPin, label: 'Location', value: 'Tawakal Toto Shop, Mombasa', href: 'https://maps.app.goo.gl/AHTa75obHAyjB3xZ8' },
        ].map(({ Icon, label, value, href }) => (
          <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} className="p-5 rounded-2xl border text-center transition-all hover:shadow-warm-md" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <Icon size={22} className="mx-auto mb-2" style={{ color: 'var(--brand-gold)' }} />
            <div className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--brand-text-muted)' }}>{label}</div>
            <div className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>{value}</div>
          </a>
        ))}
      </div>

      {sent ? (
        <div className="p-8 rounded-2xl border text-center max-w-2xl mx-auto" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(45, 90, 66, 0.12)' }}>
            <CheckCircle size={28} style={{ color: 'var(--brand-green-light)' }} />
          </div>
          <h2 className="font-serif text-2xl font-semibold mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>Message Sent!</h2>
          <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
            Thank you for reaching out. We&apos;ll get back to you within 24 hours.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border max-w-2xl mx-auto" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Send us a message</h2>
          {error && (
            <div className="mb-4 p-3 rounded-xl text-xs border" style={{ background: 'rgba(196,112,74,0.08)', borderColor: 'var(--brand-terra)', color: 'var(--brand-terra)' }} role="alert">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="contact-name" className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Your name</label>
                <input
                  id="contact-name"
                  required
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-warm w-full !pl-4"
                  style={{ background: 'var(--brand-bg-alt)' }}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Email address</label>
                <input
                  id="contact-email"
                  required
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-warm w-full !pl-4"
                  style={{ background: 'var(--brand-bg-alt)' }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="contact-subject" className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Subject <span style={{ color: 'var(--brand-text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input
                id="contact-subject"
                placeholder="What is this about?"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="input-warm w-full !pl-4"
                style={{ background: 'var(--brand-bg-alt)' }}
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: 'var(--brand-text-muted)' }}>Message</label>
              <textarea
                id="contact-message"
                required
                placeholder="Tell us how we can help…"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/20 focus:border-[var(--brand-gold)]"
                style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-6 py-3.5 text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
              ) : 'Send Message'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
