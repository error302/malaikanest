import Link from 'next/link';
import Image from 'next/image';

const SHOP_LINKS = [
  { label: 'All Products', href: '/categories' },
  { label: 'Clothing', href: '/categories' },
  { label: 'Baby Essentials', href: '/categories' },
  { label: 'Nursery', href: '/categories' },
  { label: 'Toys & Learning', href: '/categories' },
  { label: 'Travel & Safety', href: '/categories' },
  { label: 'Gifts', href: '/categories' },
];

const SUPPORT_LINKS = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Shipping Info', href: '/shipping' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'About Us', href: '/about' },
  { label: 'Order Support', href: '/contact' },
];

const SOCIAL = [
  { label: 'Facebook', href: 'https://facebook.com', icon: 'f' },
  { label: 'Instagram', href: 'https://instagram.com', icon: '◎' },
  { label: 'TikTok', href: 'https://tiktok.com', icon: '♪' },
  { label: 'WhatsApp', href: 'https://wa.me/254726771321', icon: '💬' },
];

export default function Footer() {
  return (
    <>
      {/* Main footer */}
      <footer className="bg-[#FAF4EC] border-t border-[#E0D5C8]">
        <div className="max-w-[1380px] mx-auto px-6 lg:px-16 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <Image
                src="/images/logo.png"
                alt="Malaika Nest"
                width={38}
                height={38}
                className="object-contain"
              />
              <div>
                <div className="font-serif text-lg font-semibold text-[#1A3A2A]">Malaika Nest</div>
                <div className="text-[9px] uppercase tracking-[0.14em] text-[#8A7060]">Baby &amp; Maternity</div>
              </div>
            </Link>

            <p className="text-xs text-[#5C4033] leading-relaxed font-light mb-4 max-w-[220px]">
              Premium baby products for Kenyan families.
            </p>

            {/* Social icons */}
            <div className="flex gap-2 mb-5">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-full border border-[#D8C9B8] flex items-center justify-center text-[#5C4033] hover:border-[#C9A96E] hover:text-[#1A3A2A] transition-all text-xs"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* M-Pesa call-out */}
            <div className="inline-flex items-center gap-2 bg-[#1A3A2A]/8 border border-[#1A3A2A]/15 rounded-lg px-3 py-2">
              <span className="text-base">📱</span>
              <div>
                <p className="text-[10px] text-[#5C4033] leading-none">Lipa Na M-Pesa</p>
                <p className="text-xs font-semibold text-[#1A3A2A] leading-tight">Till: 3370347</p>
              </div>
            </div>
          </div>

          {/* Shop column */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#2C1810] mb-3">
              Shop
            </h4>
            <ul className="space-y-2">
              {SHOP_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-xs text-[#5C4033] hover:text-[#1A3A2A] transition-colors font-light leading-relaxed"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support column */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#2C1810] mb-3">
              Support
            </h4>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-xs text-[#5C4033] hover:text-[#1A3A2A] transition-colors font-light leading-relaxed"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#2C1810] mb-3">
              Contact
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:malaikanest7@gmail.com"
                  className="text-xs text-[#5C4033] hover:text-[#1A3A2A] transition-colors font-light break-all"
                >
                  malaikanest7@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+254726771321"
                  className="text-xs text-[#5C4033] hover:text-[#1A3A2A] transition-colors font-light"
                >
                  +254 726 771 321
                </a>
              </li>
              <li className="text-xs text-[#5C4033] font-light">Mombasa, Kenya</li>
              <li className="text-xs text-[#5C4033] font-light">
                M-Pesa Till:{' '}
                <span className="font-semibold text-[#1A3A2A]">3370347</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#E0D5C8]">
          <div className="max-w-[1380px] mx-auto px-6 lg:px-16 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-[#8A7060]">
              © 2026 Malaika Nest. All rights reserved.
            </p>
            <p className="text-[11px] text-[#8A7060] flex items-center gap-1">
              Made with <span className="text-[#C4704A]">❤️</span> from Mombasa, Kenya
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
