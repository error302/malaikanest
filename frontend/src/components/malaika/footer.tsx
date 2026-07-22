'use client';

import Link from 'next/link';
import { Facebook, Instagram, MessageCircle, Phone, CreditCard, Mail, MapPin, Heart } from 'lucide-react';
import { Logo } from './logo';
import { useI18n } from '@/lib/i18n';
import type { Branding } from '@/lib/settings';

interface FooterProps {
  branding?: Branding;
}

import { TiktokLogo } from '@phosphor-icons/react';

function TikTok({ size = 18 }: { size?: number }) {
  return <TiktokLogo size={size} weight="fill" />;
}

const SHOP_LINKS = [
  { key: 'footer.shopAll', href: '/categories' },
  { key: 'cat.clothing', href: '/categories' },
  { key: 'cat.thrifted', href: '/thrifted' },
  { key: 'cat.feeding', href: '/categories' },
  { key: 'cat.nursery', href: '/categories' },
  { key: 'cat.toys', href: '/categories' },
  { key: 'cat.books', href: '/categories' },
];

const AGE_LINKS = [
  { label: 'Newborn', href: '/categories' },
  { label: '0–3 Months', href: '/categories' },
  { label: '3–6 Months', href: '/categories' },
  { label: '6–12 Months', href: '/categories' },
  { label: '1–4 Years', href: '/categories' },
  { label: '4–12 Years', href: '/categories' },
];

const SUPPORT_LINKS = [
  { key: 'footer.faq', href: '/faq' },
  { key: 'footer.shipping', href: '/shipping' },
  { key: 'footer.trackOrder', href: '/track' },
  { key: 'nav.contact', href: '/find-us' },
  { key: 'nav.blog', href: '/blog' },
  { key: 'footer.about', href: '/about' },
  { key: 'footer.refund', href: '/returns' },
];

const SOCIAL = (b?: Branding) => [
  { label: 'Facebook', href: b?.facebook_url || 'https://web.facebook.com/profile.php?id=61592150003761', Icon: Facebook },
  { label: 'Instagram', href: b?.instagram_url || 'https://www.instagram.com/malaikanest/', Icon: Instagram },
  { label: 'TikTok', href: b?.tiktok_url || 'https://www.tiktok.com/@malaikanest', Icon: TikTok },
  { label: 'WhatsApp', href: b?.whatsapp_url || 'https://wa.me/254726771321', Icon: MessageCircle },
];

export function Footer({ branding }: FooterProps) {
  const b = branding;
  const { t } = useI18n();
  return (
    <footer
      id="contact"
      className="pt-9 pb-9"
      style={{
        background: 'var(--brand-bg-alt)',
        borderTop: '1px solid var(--brand-border)',
      }}
      role="contentinfo"
    >
      <div className="container-shell">
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-7"
          style={{ borderBottom: '1px solid var(--brand-border)' }}
        >
          {/* Brand */}
          <div className="lg:col-span-4">
            <Logo logoUrl={b?.logo_url} storeName={b?.store_name} tagline={b?.tagline} />
             <p
               className="mt-3 text-sm leading-relaxed max-w-xs"
               style={{ color: 'var(--brand-text-secondary)' }}
             >
               {b?.footer_tagline || t('footer.tagline')}
             </p>

             {/* M-Pesa callout */}
             <div
               className="mt-4 inline-flex items-center gap-3 rounded-lg px-3 py-2 border"
               style={{
                 background: '#FFFFFF',
                 borderColor: 'var(--brand-border)',
               }}
             >
               <div
                 className="w-9 h-9 rounded-full flex items-center justify-center"
                 style={{ background: 'rgba(139, 105, 20, 0.1)' }}
               >
                 <CreditCard size={16} style={{ color: 'var(--brand-gold)' }} />
               </div>
               <div>
                 <p
                   className="text-[11px]"
                   style={{ color: 'var(--brand-text-muted)' }}
                 >
                   Lipa Na M-Pesa
                 </p>
                 <p
                   className="text-sm font-semibold"
                   style={{ color: 'var(--brand-text)' }}
                 >
                   Till: 3370347
                 </p>
               </div>
             </div>

             {/* Social */}
             <div className="flex gap-2.5 mt-4">
               {SOCIAL(b).map(({ label, href, Icon }) => (
                 <a
                   key={label}
                   href={href}
                   target="_blank"
                   rel="noopener noreferrer"
                   aria-label={label}
                   className="w-9 h-9 rounded-full border flex items-center justify-center transition-all hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
                   style={{
                     background: '#FFFFFF',
                     borderColor: 'var(--brand-border)',
                     color: 'var(--brand-brown)',
                   }}
                 >
                   <Icon size={16} />
                 </a>
               ))}
             </div>
           </div>

           {/* Links */}
           <div className="lg:col-span-8">
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-6">
<div>
                  <h3
                    className="text-[11px] uppercase tracking-[0.14em] font-semibold mb-3"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    {t('footer.shop')}
                  </h3>
                 <ul className="space-y-1.5">
                   {SHOP_LINKS.map((l) => (
                     <li key={l.key}>
                       <Link
                         href={l.href}
                         className="text-[13px] transition-colors hover:text-[var(--brand-gold)] block py-0.5 leading-snug"
                         style={{ color: 'var(--brand-text-secondary)' }}
                       >
                         {t(l.key)}
                       </Link>
                     </li>
                   ))}
                 </ul>
               </div>

<div>
                  <h3
                    className="text-[11px] uppercase tracking-[0.14em] font-semibold mb-3"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    {t('nav.shopByAge')}
                  </h3>
                 <ul className="space-y-1.5">
                   {AGE_LINKS.map((l) => (
                     <li key={l.label}>
                       <Link
                         href={l.href}
                         className="text-[13px] transition-colors hover:text-[var(--brand-gold)] block py-0.5 leading-snug"
                         style={{ color: 'var(--brand-text-secondary)' }}
                       >
                         {l.label}
                       </Link>
                     </li>
                   ))}
                 </ul>
               </div>

<div className="col-span-2 sm:col-span-1">
                  <h3
                    className="text-[11px] uppercase tracking-[0.14em] font-semibold mb-3"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    {t('footer.help')}
                  </h3>
                 <ul className="space-y-1.5">
                   {SUPPORT_LINKS.map((l) => (
                     <li key={l.key}>
                       <Link
                         href={l.href}
                         className="text-[13px] transition-colors hover:text-[var(--brand-gold)] block py-0.5 leading-snug"
                         style={{ color: 'var(--brand-text-secondary)' }}
                       >
                         {t(l.key)}
                       </Link>
                     </li>
                   ))}
                 </ul>

<h3
                    className="text-[11px] uppercase tracking-[0.14em] font-semibold mb-2 mt-4"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    {t('nav.contact')}
                  </h3>
                 <ul className="space-y-1.5">
                   <li>
                     <a
                       href={`mailto:${b?.contact_email || "hello@malaikanest.com"}`}
                       className="text-[13px] inline-flex items-center gap-2 transition-colors hover:text-[var(--brand-gold)]"
                       style={{ color: 'var(--brand-text-secondary)' }}
                     >
                       <Mail size={13} /> {b?.contact_email || 'hello@malaikanest.com'}
                     </a>
                   </li>
                   <li>
                     <a
                       href={`tel:${b?.contact_phone || "+254726771321"}`}
                       className="text-[13px] inline-flex items-center gap-2 transition-colors hover:text-[var(--brand-gold)]"
                       style={{ color: 'var(--brand-text-secondary)' }}
                     >
                       <Phone size={13} /> {b?.contact_phone || '+254 726 771 321'}
                     </a>
                   </li>
                   <li
                     className="text-[13px] inline-flex items-center gap-2"
                     style={{ color: 'var(--brand-text-secondary)' }}
                   >
                     <MapPin size={13} /> {b?.location || 'Mombasa, Kenya'}
                   </li>
                 </ul>
               </div>
             </div>
           </div>
         </div>

         {/* Bottom bar */}
         <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
           <p
             className="text-[11px]"
             style={{ color: 'var(--brand-text-muted)' }}
           >
             {t('footer.copyright', { year: new Date().getFullYear() })}
           </p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
             <Link
               href="/privacy-policy"
               className="text-[11px] transition-colors hover:text-[var(--brand-gold)]"
               style={{ color: 'var(--brand-text-muted)' }}
             >
               {t('footer.privacy')}
             </Link>
             <Link
               href="/terms-of-service"
               className="text-[11px] transition-colors hover:text-[var(--brand-gold)]"
               style={{ color: 'var(--brand-text-muted)' }}
             >
               {t('footer.terms')}
             </Link>
           </div>
         </div>
       </div>
     </footer>
   );
 }
