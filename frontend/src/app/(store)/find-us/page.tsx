import type { Metadata } from 'next';
import { MapPin, Clock, Phone, Mail, MessageCircle, Navigation, Car, Bus, Camera } from 'lucide-react';
import { getSiteSettings } from '@/lib/settings';
import { getShopPhotos } from '@/lib/shop-photos';

export const metadata: Metadata = {
  title: 'Find Us',
  description: 'Visit the Malaika Nest workshop in Mombasa, Kenya. See our location on the map, business hours and contact details.',
};

export const dynamic = 'force-dynamic';

export default async function FindUsPage() {
  const { branding } = await getSiteSettings();
  const photos = await getShopPhotos();

  return (
    <div className="container-shell py-6 sm:py-10">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4" style={{ background: 'rgba(139,105,20,0.1)' }}>
          <MapPin size={14} style={{ color: 'var(--brand-gold)' }} />
          <span className="text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'var(--brand-gold)' }}>
            Visit Our Workshop
          </span>
        </div>
        <h1 className="font-serif font-semibold tracking-tight mb-3" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.15 }}>
          Find Us in Mombasa
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--brand-text-secondary)' }}>
          We&apos;d love to meet you and your little one in person. Pop by our workshop for in-person shopping, pickups, or just to say hello!
        </p>
      </div>

      {/* Shop photos gallery */}
      {photos.length > 0 && (
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Camera size={18} style={{ color: 'var(--brand-gold)' }} />
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
              Our Workshop
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.image}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl overflow-hidden border aspect-square relative"
                style={{ borderColor: 'var(--brand-border)' }}
              >
                <img
                  src={photo.image}
                  alt={photo.caption || 'Shop photo'}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-xs font-medium">{photo.caption}</p>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
        {/* Map */}
        <div className="rounded-2xl overflow-hidden border shadow-warm-md" style={{ borderColor: 'var(--brand-border)' }}>
          <iframe
            src={branding.map_embed_url}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: '400px', display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Malaika Nest location on Google Maps"
          />
        </div>

        {/* Info sidebar */}
        <div className="space-y-4">
          {/* Address */}
          <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,105,20,0.12)' }}>
                <MapPin size={18} style={{ color: 'var(--brand-gold)' }} />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--brand-text)' }}>Our Address</h2>
                <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>{branding.address_line}</p>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--brand-text-muted)' }}>{branding.address_directions}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branding.address_line)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ background: 'var(--brand-warm)', color: 'var(--brand-gold)' }}
                >
                  <Navigation size={12} /> Get Directions
                </a>
              </div>
            </div>
          </div>

          {/* Business hours */}
          <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(45,90,66,0.12)' }}>
                <Clock size={18} style={{ color: 'var(--brand-green-light)' }} />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--brand-text)' }}>Business Hours</h2>
                <div className="space-y-2">
                  {branding.business_hours.map((entry, i) => {
                    const isToday = new Date().getDay() === ((i + 1) % 7);
                    const isClosed = entry.hours.toLowerCase().includes('closed');
                    return (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg" style={{ background: isToday ? 'rgba(139,105,20,0.08)' : 'transparent' }}>
                        <span className="font-medium" style={{ color: isToday ? 'var(--brand-gold)' : 'var(--brand-text)' }}>
                          {entry.day}
                          {isToday && <span className="ml-1.5 text-[9px] uppercase tracking-wider" style={{ color: 'var(--brand-gold)' }}>Today</span>}
                        </span>
                        <span style={{ color: isClosed ? 'var(--brand-terra)' : 'var(--brand-text-secondary)' }}>
                          {entry.hours}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--brand-text)' }}>Get in Touch</h2>
            <div className="space-y-2.5">
              <a href={`tel:${branding.contact_phone}`} className="flex items-center gap-2.5 text-sm transition-colors hover:text-[var(--brand-gold)]" style={{ color: 'var(--brand-text-secondary)' }}>
                <Phone size={15} style={{ color: 'var(--brand-gold)' }} /> {branding.contact_phone}
              </a>
              <a href={`mailto:${branding.contact_email}`} className="flex items-center gap-2.5 text-sm transition-colors hover:text-[var(--brand-gold)]" style={{ color: 'var(--brand-text-secondary)' }}>
                <Mail size={15} style={{ color: 'var(--brand-gold)' }} /> {branding.contact_email}
              </a>
              <a href={branding.whatsapp_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm transition-colors hover:text-[var(--brand-gold)]" style={{ color: 'var(--brand-text-secondary)' }}>
                <MessageCircle size={15} style={{ color: 'var(--brand-green-light)' }} /> WhatsApp us
              </a>
            </div>
          </div>

          {/* Getting here */}
          <div className="p-5 rounded-2xl border" style={{ background: 'var(--brand-bg-alt)', borderColor: 'var(--brand-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--brand-text)' }}>Getting Here</h2>
            <div className="space-y-2 text-xs" style={{ color: 'var(--brand-text-secondary)' }}>
              <div className="flex items-start gap-2">
                <Car size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-gold)' }} />
                <span>Free parking available on-site. Easy access from Nyali and the city center.</span>
              </div>
              <div className="flex items-start gap-2">
                <Bus size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-gold)' }} />
                <span>Accessible by matatu — ask for the Mombasa town stop and it&apos;s a short walk.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust banner */}
      <div className="mt-8 sm:mt-10 p-6 sm:p-8 rounded-2xl text-center" style={{ background: 'var(--brand-brown-dark)' }}>
        <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-cormorant)' }}>
          A real workshop, not just a website
        </h2>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
          We&apos;re proud to be a real, physical business in Mombasa. When you shop with Malaika Nest, you&apos;re supporting a local Kenyan maker — not a faceless online store. Come say hi!
        </p>
      </div>
    </div>
  );
}
