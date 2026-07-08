/**
 * Server-side site settings + content blocks fetcher.
 *
 * The storefront reads branding and editable text from here. Every value has
 * a hardcoded default, so the site renders correctly even before the admin
 * configures anything. The admin dashboard writes overrides to the DB.
 *
 * Cached for 60 seconds in-memory to avoid hitting the DB on every request.
 */
import { db } from '@/lib/db';

// ── Hardcoded defaults (used when DB has no override) ────────────────────────

export const DEFAULT_BRANDING = {
  logo_url: '',                          // empty = use built-in SVG logo
  favicon_url: '',                       // empty = use /logo.svg
  store_name: 'Malaika Nest',
  tagline: 'Baby & Maternity',
  footer_tagline: 'Handcrafted organic clothing, accessories & toys made with love in Kenya. For little ones aged 0–12 years.',
  primary_color: '#8B6914',
  accent_color: '#C4704A',
  announcement_messages: JSON.stringify([
    'Free delivery on orders over <strong>KES 3,000</strong>',
    'Same-day delivery in Mombasa',
    'Lipa Na M-Pesa · Till 3370347',
    'Handcrafted with love in Kenya',
  ]),
  contact_email: 'malaikanest7@gmail.com',
  contact_phone: '+254726771321',
  mpesa_till: '3370347',
  whatsapp_url: 'https://wa.me/254726771321',
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  location: 'Mombasa, Kenya',
  copyright_name: 'Malaika Nest',
} as const;

export const DEFAULT_CONTENT: Record<string, Record<string, string>> = {
  hero: {
    slide1_tag: 'Premium Baby Care',
    slide1_headline: 'A Premium Nest',
    slide1_highlight: 'for Little Ones',
    slide1_sub: 'Handcrafted organic clothing, accessories & toys made with love in Kenya. For ages 0–12 years.',
    slide1_cta: 'Shop Newborn',
    slide2_tag: 'Organic Collection',
    slide2_headline: 'Organic Cotton',
    slide2_highlight: 'for Soft Skin',
    slide2_sub: 'Gentle, breathable fabrics made from 100% organic cotton. Perfect for your baby\'s delicate skin.',
    slide2_cta: 'Shop Clothing',
    slide3_tag: 'Gift Ideas',
    slide3_headline: 'The Perfect',
    slide3_highlight: 'Baby Gift',
    slide3_sub: 'Beautifully curated gift sets for baby showers, newborns and special milestones.',
    slide3_cta: 'Browse Gifts',
  },
  shop_by_age: {
    label: 'Find the perfect size',
    title: 'Shop by Age',
    subtitle: 'From newborn snuggles to first-day-of-school fits — we\'ve got every stage covered.',
  },
  categories: {
    label: 'Browse collections',
    title: 'Curated Categories',
    subtitle: 'Thoughtfully selected for every moment of your baby\'s journey.',
  },
  featured: {
    label: 'Hand-picked',
    title: 'Featured Products',
    view_all: 'View All',
  },
  best_sellers: {
    label: 'Most loved',
    title: 'Best Sellers',
    view_all: 'See More',
  },
  new_arrivals: {
    label: 'Just landed',
    title: 'New Arrivals',
    view_all: 'Shop New',
  },
  value_props: {
    // Individual value props are in the ValueProp table
  },
  testimonials: {
    label: 'Loved by parents',
    title: 'What Families Are Saying',
    aggregate_rating: '4.9 / 5 · 1,200+ reviews',
  },
  newsletter: {
    badge: 'Join the Nest',
    title: 'Get 10% off your first order',
    subtitle: 'Subscribe for new arrivals, exclusive offers and parenting tips — straight to your inbox.',
    cta: 'Subscribe',
    placeholder: 'you@email.com',
    disclaimer: 'No spam, only love. Unsubscribe anytime.',
    success_message: 'Subscribed',
  },
  footer: {
    // Footer uses branding.footer_tagline + branding.contact_*
  },
} as const;

export const DEFAULT_VALUE_PROPS = [
  { icon: 'Shield', title: 'Safe Materials', subtitle: 'OEKO-TEX certified, tested for your baby' },
  { icon: 'Truck', title: 'Fast Delivery', subtitle: 'Same-day in Mombasa, 1–3 days countrywide' },
  { icon: 'Heart', title: 'Parent Approved', subtitle: 'Trusted by 5,000+ Kenyan families' },
  { icon: 'CreditCard', title: 'Secure M-Pesa', subtitle: 'Till 3370347 · Pay safely, every time' },
] as const;

export const DEFAULT_TESTIMONIALS = [
  {
    name: 'Amina W.',
    location: 'Mombasa',
    rating: 5,
    text: 'The organic cotton onesies are incredibly soft. My baby\'s skin has never been happier. Same-day delivery was a lifesaver!',
    product: 'Organic Newborn Set',
    initials: 'AW',
  },
  {
    name: 'Grace M.',
    location: 'Nairobi',
    rating: 5,
    text: 'I ordered the gift set for my sister\'s baby shower and it was beautifully packaged. The quality exceeded my expectations.',
    product: 'Baby Shower Gift Bundle',
    initials: 'GM',
  },
  {
    name: 'Joy K.',
    location: 'Kisumu',
    rating: 5,
    text: 'Finally a Kenyan baby shop that gets it right. Premium quality, fair prices, and the M-Pesa checkout was instant.',
    product: 'Toddler Clothing Pack',
    initials: 'JK',
  },
] as const;

// ── Types ────────────────────────────────────────────────────────────────────

export interface Branding {
  logo_url: string;
  favicon_url: string;
  store_name: string;
  tagline: string;
  footer_tagline: string;
  primary_color: string;
  accent_color: string;
  announcement_messages: string[];
  contact_email: string;
  contact_phone: string;
  mpesa_till: string;
  whatsapp_url: string;
  facebook_url: string;
  instagram_url: string;
  location: string;
  copyright_name: string;
}

export interface ContentMap {
  [section: string]: Record<string, string>;
}

// ── In-memory cache (60s TTL) ────────────────────────────────────────────────

let cache: { branding: Branding; content: ContentMap; ts: number } | null = null;
const CACHE_TTL = 60_000;

function parseBranding(rows: { key: string; value: string }[]): Branding {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const get = (k: keyof typeof DEFAULT_BRANDING) => map.get(k) ?? DEFAULT_BRANDING[k];
  let announcement: string[] = [];
  try {
    announcement = JSON.parse(get('announcement_messages'));
    if (!Array.isArray(announcement)) announcement = JSON.parse(DEFAULT_BRANDING.announcement_messages);
  } catch {
    announcement = JSON.parse(DEFAULT_BRANDING.announcement_messages);
  }
  return {
    logo_url: get('logo_url'),
    favicon_url: get('favicon_url'),
    store_name: get('store_name'),
    tagline: get('tagline'),
    footer_tagline: get('footer_tagline'),
    primary_color: get('primary_color'),
    accent_color: get('accent_color'),
    announcement_messages: announcement,
    contact_email: get('contact_email'),
    contact_phone: get('contact_phone'),
    mpesa_till: get('mpesa_till'),
    whatsapp_url: get('whatsapp_url'),
    facebook_url: get('facebook_url'),
    instagram_url: get('instagram_url'),
    location: get('location'),
    copyright_name: get('copyright_name'),
  };
}

function parseContent(rows: { section: string; key: string; value: string }[]): ContentMap {
  const out: ContentMap = {};
  for (const r of rows) {
    if (!out[r.section]) out[r.section] = {};
    out[r.section][r.key] = r.value;
  }
  // Merge with defaults (DB overrides defaults)
  const merged: ContentMap = {};
  for (const [section, keys] of Object.entries(DEFAULT_CONTENT)) {
    merged[section] = { ...keys };
    if (out[section]) Object.assign(merged[section], out[section]);
  }
  return merged;
}

/** Fetch branding + content blocks from DB, merged with defaults. Cached 60s. */
export async function getSiteSettings(): Promise<{ branding: Branding; content: ContentMap }> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache;

  try {
    const [settingRows, contentRows] = await Promise.all([
      db.siteSetting.findMany(),
      db.contentBlock.findMany({ where: { isActive: true } }),
    ]);
    const branding = parseBranding(settingRows.map((s) => ({ key: s.key, value: s.value })));
    const content = parseContent(contentRows.map((c) => ({ section: c.section, key: c.key, value: c.value })));
    cache = { branding, content, ts: Date.now() };
    return cache;
  } catch {
    // DB not available — return defaults
    const branding: Branding = {
      ...DEFAULT_BRANDING,
      announcement_messages: JSON.parse(DEFAULT_BRANDING.announcement_messages),
    } as Branding;
    return { branding, content: DEFAULT_CONTENT as ContentMap };
  }
}

/** Fetch active testimonials from DB, falling back to defaults. */
export async function getTestimonials() {
  try {
    const rows = await db.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
    if (rows.length > 0) return rows;
    return DEFAULT_TESTIMONIALS.map((t, i) => ({ ...t, id: `default-${i}`, position: i, isActive: true, createdAt: new Date(), updatedAt: new Date() }));
  } catch {
    return DEFAULT_TESTIMONIALS.map((t, i) => ({ ...t, id: `default-${i}`, position: i, isActive: true, createdAt: new Date(), updatedAt: new Date() }));
  }
}

/** Fetch active value props from DB, falling back to defaults. */
export async function getValueProps() {
  try {
    const rows = await db.valueProp.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }],
    });
    if (rows.length > 0) return rows;
    return DEFAULT_VALUE_PROPS.map((v, i) => ({ ...v, id: `default-${i}`, position: i, isActive: true, updatedAt: new Date() }));
  } catch {
    return DEFAULT_VALUE_PROPS.map((v, i) => ({ ...v, id: `default-${i}`, position: i, isActive: true, updatedAt: new Date() }));
  }
}

/** Invalidate the cache (call after admin updates). */
export function invalidateSettingsCache() {
  cache = null;
}

/** Helper: get a single content value with fallback. */
export function getContent(content: ContentMap, section: string, key: string, fallback = ''): string {
  return content?.[section]?.[key] ?? fallback;
}
