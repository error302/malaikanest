import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, MessageCircle, Phone, CreditCard, Heart, Mail, MapPin } from 'lucide-react';

const SHOP_LINKS = [
  { label: 'All Products', href: '/categories' },
  { label: 'Clothing', href: '/categories' },
  { label: 'Baby Essentials', href: '/categories' },
  { label: 'Nursery', href: '/categories' },
  { label: 'Toys & Learning', href: '/categories' },
  { label: 'Travel & Safety', href: '/categories' },
  { label: 'Gifts', href: '/categories' },
];

const AGE_LINKS = [
  { label: 'Newborn', href: '/categories?age=newborn' },
  { label: '0-3 Months', href: '/categories?age=0-3' },
  { label: '3-6 Months', href: '/categories?age=3-6' },
  { label: '6-12 Months', href: '/categories?age=6-12' },
  { label: '1-4 Years', href: '/categories?age=1-4' },
  { label: '4-12 Years', href: '/categories?age=4-12' },
];

const SUPPORT_LINKS = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Shipping Info', href: '/shipping' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'About Us', href: '/about' },
  { label: 'Order Support', href: '/contact' },
];

const SOCIAL = [
  { label: 'Facebook', href: 'https://facebook.com', Icon: Facebook },
  { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
  { label: 'WhatsApp', href: 'https://wa.me/254726771321', Icon: MessageCircle },
];

export default function Footer() {
  return (
    <>
      {/* Main footer */}
      <footer className="bg-[#FAF4EC] border-t border-[#E8E0D5]">
        <div className="max-w-[1380px] mx-auto px-6 lg:px-16 py-12">
          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-10 border-b border-[#E8E0D5]">
            {/* Brand column */}
            <div className="lg:col-span-4">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="relative w-10 h-10">
                  <Image
                    src="/images/logo.png"
                    alt="Malaika Nest"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="font-serif text-xl font-semibold text-[#2C1810]">Malaika Nest</div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[#8A7060]">Premium Baby Store</div>
                </div>
              </Link>

              <p className="text-sm text-[#5C4033] leading-relaxed mb-6 max-w-xs">
                Handcrafted organic clothing, accessories & toys made with love in Kenya. For little ones aged 0-12 years.
              </p>

              {/* M-Pesa call-out */}
              <div className="inline-flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[#E8E0D5]">
                <div className="w-10 h-10 rounded-full bg-[#8B6914]/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#8B6914]" />
                </div>
                <div>
                  <p className="text-xs text-[#8A7060]">Lipa Na M-Pesa</p>
                  <p className="text-sm font-semibold text-[#2C1810]">Till: 3370347</p>
                </div>
              </div>

              {/* Social icons */}
              <div className="flex gap-3 mt-6">
                {SOCIAL.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-full bg-white border border-[#E8E0D5] flex items-center justify-center text-[#5C4033] hover:border-[#8B6914] hover:text-[#8B6914] transition-all"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {/* Links columns */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                {/* Shop */}
                <div>
                  <h4 className="text-xs uppercase tracking-[0.12em] font-semibold text-[#2C1810] mb-4">
                    Shop
                  </h4>
                  <ul className="space-y-3">
                    {SHOP_LINKS.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          className="text-sm text-[#5C4033] hover:text-[#8B6914] transition-colors"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Shop by Age */}
                <div>
                  <h4 className="text-xs uppercase tracking-[0.12em] font-semibold text-[#2C1810] mb-4">
                    Shop by Age
                  </h4>
                  <ul className="space-y-3">
                    {AGE_LINKS.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          className="text-sm text-[#5C4033] hover:text-[#8B6914] transition-colors"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Support & Contact */}
                <div>
                  <h4 className="text-xs uppercase tracking-[0.12em] font-semibold text-[#2C1810] mb-4">
                    Support
                  </h4>
                  <ul className="space-y-3">
                    {SUPPORT_LINKS.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          className="text-sm text-[#5C4033] hover:text-[#8B6914] transition-colors"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <h4 className="text-xs uppercase tracking-[0.12em] font-semibold text-[#2C1810] mb-4 mt-6">
                    Contact
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <a
                        href="mailto:malaikanest7@gmail.com"
                        className="text-sm text-[#5C4033] hover:text-[#8B6914] transition-colors flex items-center gap-2"
                      >
                        <Mail size={14} /> malaikanest7@gmail.com
                      </a>
                    </li>
                    <li>
                      <a
                        href="tel:+254726771321"
                        className="text-sm text-[#5C4033] hover:text-[#8B6914] transition-colors flex items-center gap-2"
                      >
                        <Phone size={14} /> +254 726 771 321
                      </a>
                    </li>
                    <li className="text-sm text-[#5C4033] flex items-center gap-2">
                      <MapPin size={14} /> Mombasa, Kenya
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#8A7060]">
              © 2026 Malaika Nest. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy-policy" className="text-xs text-[#8A7060] hover:text-[#8B6914] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-xs text-[#8A7060] hover:text-[#8B6914] transition-colors">
                Terms of Service
              </Link>
              <p className="text-xs text-[#8A7060] flex items-center gap-1">
                Made with <Heart size={12} className="text-[#C4704A] fill-[#C4704A]" /> from Mombasa, Kenya
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
