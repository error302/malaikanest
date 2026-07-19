import type { Metadata } from 'next';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Malaika Nest. We respond to all enquiries within 24 hours.',
};

export default function ContactPage() {
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
          { Icon: Mail, label: 'Email', value: 'malaikanest7@gmail.com', href: 'mailto:malaikanest7@gmail.com' },
          { Icon: Phone, label: 'Phone', value: '+254 726 771 321', href: 'tel:+254726771321' },
          { Icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us', href: 'https://wa.me/254726771321' },
          { Icon: MapPin, label: 'Location', value: 'Tawakal Toto Shop, Mombasa', href: 'https://maps.app.goo.gl/AHTa75obHAyjB3xZ8' },
        ].map(({ Icon, label, value, href }) => (
          <a key={label} href={href} className="p-5 rounded-2xl border text-center transition-all hover:shadow-warm-md" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <Icon size={22} className="mx-auto mb-2" style={{ color: 'var(--brand-gold)' }} />
            <div className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--brand-text-muted)' }}>{label}</div>
            <div className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>{value}</div>
          </a>
        ))}
      </div>

      <form className="p-6 sm:p-8 rounded-2xl border max-w-2xl mx-auto" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <h2 className="font-serif text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>Send us a message</h2>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder="Your name" className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
            <input required type="email" placeholder="Email" className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
          </div>
          <input placeholder="Subject (optional)" className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
          <textarea required placeholder="Your message" rows={5} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ background: 'var(--brand-bg-alt)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
          <button type="submit" className="w-full rounded-full px-6 py-3.5 text-sm font-semibold" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            Send Message
          </button>
        </div>
      </form>
    </div>
  );
}
