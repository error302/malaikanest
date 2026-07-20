'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Lightweight i18n context for English ↔ Swahili toggle.
 * Stores the preference in localStorage. Falls back to English.
 *
 * The translations cover the most visible UI strings (nav, hero, sections,
 * buttons, footer). Product names and descriptions stay in English (they come
 * from the Django backend), but all chrome/UI text is translated.
 */

export type Language = 'en' | 'sw';

const STORAGE_KEY = 'malaika_lang';

// ── Translation dictionary ────────────────────────────────────────────────────
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.shop': 'Shop',
    'nav.mtumba': 'Mtumba',
    'nav.best_sellers': 'Best Sellers',
    'nav.find_us': 'Find Us',
    'nav.about': 'About',
    'nav.cart': 'Cart',
    'nav.account': 'Account',
    'nav.wishlist': 'Wishlist',
    'nav.search': 'Search baby essentials…',
    // Hero
    'hero.trust.made_in_kenya': 'Made with love in Kenya',
    'hero.trust.free_shipping': 'FREE Shipping KES 3,000+',
    'hero.trust.secure_mpesa': 'Secure M-Pesa Payments',
    // Sections
    'section.shop_by_age': 'Shop by Age',
    'section.shop_by_age_sub': 'From newborn snuggles to first-day-of-school fits — we\'ve got every stage covered.',
    'section.categories': 'Curated Categories',
    'section.featured': 'Featured Products',
    'section.best_sellers': 'Best Sellers',
    'section.new_arrivals': 'New Arrivals',
    'section.thrifted': 'Pre-loved Treasures',
    'section.thrifted_sub': 'Gently-used premium baby & kids clothing at a fraction of the price. Each item is one-of-a-kind.',
    'section.testimonials': 'What Families Are Saying',
    'section.view_all': 'View All',
    // Product
    'product.add_to_cart': 'Add to Cart',
    'product.quick_add': 'Quick Add',
    'product.out_of_stock': 'Out of Stock',
    'product.in_stock': 'In stock',
    'product.view_options': 'View Options',
    'product.sold_out': 'Sold Out',
    'product.reviews': 'Customer Reviews',
    'product.write_review': 'Write a Review',
    'product.related': 'Complete the Look',
    // Cart
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.empty_desc': 'Looks like you haven\'t added anything yet. Let\'s find something lovely for your little one.',
    'cart.subtotal': 'Subtotal',
    'cart.delivery': 'Delivery',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.continue_shopping': 'Continue Shopping',
    'cart.free_shipping_msg': 'FREE',
    'cart.free_shipping_progress': 'Add KES {amount} more for free delivery',
    // Checkout
    'checkout.title': 'Checkout',
    'checkout.contact': 'Contact Details',
    'checkout.shipping': 'Shipping Address',
    'checkout.payment': 'Payment Method',
    'checkout.order': 'Your Order',
    'checkout.place_order': 'Place Order',
    'checkout.first_name': 'First name',
    'checkout.last_name': 'Last name',
    'checkout.email': 'Email',
    'checkout.phone': 'Phone (+2547XXXXXXXX)',
    'checkout.address': 'Street address',
    'checkout.city': 'City',
    'checkout.postal': 'Postal code (optional)',
    // Newsletter
    'newsletter.badge': 'Join the Nest',
    'newsletter.title': 'Get 10% off your first order',
    'newsletter.cta': 'Subscribe',
    'newsletter.placeholder': 'you@email.com',
    'newsletter.disclaimer': 'No spam, only love. Unsubscribe anytime.',
    // Footer
    'footer.shop': 'Shop',
    'footer.shopAll': 'Shop All',
    'footer.age': 'Shop by Age',
    'footer.help': 'Help',
    'footer.faq': 'FAQ',
    'footer.shipping': 'Shipping',
    'footer.trackOrder': 'Track Order',
    'footer.about': 'About Us',
    'footer.refund': 'Returns',
    'footer.tagline': 'Handcrafted organic clothing, accessories & toys made with love in Kenya. For little ones aged 0–12 years.',
    'footer.copyright': '© {year} Malaika Nest. All rights reserved.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'nav.contact': 'Contact',
    'nav.blog': 'Blog',
    'nav.shopByAge': 'Shop by Age',
    'cat.clothing': 'Clothing',
    'cat.thrifted': 'Mtumba',
    'cat.feeding': 'Feeding',
    'cat.nursery': 'Nursery',
    'cat.toys': 'Toys',
    'cat.books': 'Books',
    'footer.support': 'Support',
    'footer.contact': 'Contact',
    'footer.made_with_love': 'Made with love from',
    // Trust
    'trust.safe_materials': 'Safe Materials',
    'trust.fast_delivery': 'Fast Delivery',
    'trust.parent_approved': 'Parent Approved',
    'trust.secure_mpesa': 'Secure M-Pesa',
    // Misc
    'common.loading': 'Loading…',
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
  },
  sw: {
    // Nav
    'nav.home': 'Nyumbani',
    'nav.shop': 'Duka',
    'nav.mtumba': 'Mtumba',
    'nav.best_sellers': 'Wanunuaji Zaidi',
    'nav.find_us': 'Pata Sisi',
    'nav.about': 'Kuhusu',
    'nav.cart': 'Kikapu',
    'nav.account': 'Akaunti',
    'nav.wishlist': 'Mapendeleo',
    'nav.search': 'Tafuta bidhaa za mtoto…',
    // Hero
    'hero.trust.made_in_kenya': 'Imetengenezwa kwa upendo Kenya',
    'hero.trust.free_shipping': 'Usafirishaji BURE KES 3,000+',
    'hero.trust.secure_mpesa': 'Malipo Salama ya M-Pesa',
    // Sections
    'section.shop_by_age': 'Nunua kwa Umri',
    'section.shop_by_age_sub': 'Kutoka mtoto mchanga hadi kwanza kwenda shule — tuna kila hatua.',
    'section.categories': 'Makundi YaliyoChaguliwa',
    'section.featured': 'Bidhaa ZilizoChaguliwa',
    'section.best_sellers': 'Wanunuaji Zaidi',
    'section.new_arrivals': 'Mpya Uliofika',
    'section.thrifted': 'Hazina Zilizotumika',
    'section.thrifted_sub': 'Nguo za watoto za hali ya juu kwa bei nafuu. Kila kitu ni cha kipekee.',
    'section.testimonials': 'Wazini Wanasema Nini',
    'section.view_all': 'Ona Zote',
    // Product
    'product.add_to_cart': 'Ongeza kwenye Kikapu',
    'product.quick_add': 'Ongeza Haraka',
    'product.out_of_stock': 'Haina Stock',
    'product.in_stock': 'Ipo',
    'product.view_options': 'Ona Chaguo',
    'product.sold_out': 'Imeuzwa',
    'product.reviews': 'Maoni ya Wateja',
    'product.write_review': 'Andika Maoni',
    'product.related': 'Kamilisha Look',
    // Cart
    'cart.title': 'Kikapu Chako',
    'cart.empty': 'Kikapu chako ni tupu',
    'cart.empty_desc': 'Onaonekana hujaweka kitu chochote. Hebu tupate kitu kizuri kwa mtoto wako.',
    'cart.subtotal': 'Jumla',
    'cart.delivery': 'Usafirishaji',
    'cart.total': 'Jumla Yaote',
    'cart.checkout': 'Lipa',
    'cart.continue_shopping': 'Endelea Kununua',
    'cart.free_shipping_msg': 'BURE',
    'cart.free_shipping_progress': 'Ongeza KES {amount} zaidi kwa usafirishaji bure',
    // Checkout
    'checkout.title': 'Lipa',
    'checkout.contact': 'Maelezo Ya Mawasiliano',
    'checkout.shipping': 'Anwani Ya Uwasilishaji',
    'checkout.payment': 'Njia Ya Malipo',
    'checkout.order': 'Oda Yako',
    'checkout.place_order': 'Weka Oda',
    'checkout.first_name': 'Jina la kwanza',
    'checkout.last_name': 'Jina la mwisho',
    'checkout.email': 'Barua pepe',
    'checkout.phone': 'Simu (+2547XXXXXXXX)',
    'checkout.address': 'Anwani ya mtaa',
    'checkout.city': 'Jiji',
    'checkout.postal': 'Kodi ya posta (siyo lazima)',
    // Newsletter
    'newsletter.badge': 'Jiunge Nasili',
    'newsletter.title': 'Punguzo la 10% kwa oda yako ya kwanza',
    'newsletter.cta': 'Jiunge',
    'newsletter.placeholder': 'wewe@email.com',
    'newsletter.disclaimer': 'Hakuna spam, upendo tu. Ondoka wakati wowote.',
    // Footer
    'footer.shop': 'Duka',
    'footer.shopAll': 'Nunua Zote',
    'footer.age': 'Nunua kwa Umri',
    'footer.help': 'Msaada',
    'footer.faq': 'Maswali Yanayoulizwa Mara kwa Mara',
    'footer.shipping': 'Usafirishaji',
    'footer.trackOrder': 'Fuatilia Oda',
    'footer.about': 'Kuhusu Sisi',
    'footer.refund': 'Marejesho',
    'footer.tagline': 'Nguo, vifaa na vichezeo vya watoto vilivyotengenezwa kwa upendo nchini Kenya. Kwa watoto wa miaka 0–12.',
    'footer.copyright': '© {year} Malaika Nest. Haki zote zimehifadhiwa.',
    'footer.privacy': 'Sera ya Faragha',
    'footer.terms': 'Masharti ya Huduma',
    'nav.contact': 'Mawasiliano',
    'nav.blog': 'Blogu',
    'nav.shopByAge': 'Nunua kwa Umri',
    'cat.clothing': 'Nguo',
    'cat.thrifted': 'Mtumba',
    'cat.feeding': 'Kulisha',
    'cat.nursery': 'Chumba cha Mtoto',
    'cat.toys': 'Vichezeo',
    'cat.books': 'Vitabu',
    'footer.support': 'Msaada',
    'footer.contact': 'Mawasiliano',
    'footer.made_with_love': 'Imetengenezwa kwa upendo kutoka',
    // Trust
    'trust.safe_materials': 'Vifaa Salama',
    'trust.fast_delivery': 'Usafirishaji Wa Haraka',
    'trust.parent_approved': 'Wazini Wameidhinisha',
    'trust.secure_mpesa': 'M-Pesa Salama',
    // Misc
    'common.loading': 'Inapakia…',
    'common.back': 'Rudi',
    'common.cancel': 'Ghairi',
    'common.save': 'Hifadhi',
    'common.delete': 'Futa',
  },
};

// ── Context ───────────────────────────────────────────────────────────────────

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggle: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Read stored language on first client render (lazy initializer avoids effect)
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored === 'en' || stored === 'sw') return stored;
    } catch {
      // localStorage unavailable
    }
    return 'en';
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === 'en' ? 'sw' : 'en');
  }, [lang, setLang]);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    let str = translations[lang]?.[key] ?? translations.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback if used outside provider — returns English
    return {
      lang: 'en' as Language,
      setLang: () => {},
      toggle: () => {},
      t: (key: string) => translations.en[key] ?? key,
    };
  }
  return ctx;
}
