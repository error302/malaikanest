import { db } from '@/lib/db';
import { SITE_URL, SITE_NAME } from '@/lib/site-config';

const BASE_URL = SITE_URL;

export async function GET() {
  const body = await buildFull();
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=600, s-maxage=1800',
    },
  });
}

async function buildFull(): Promise<string> {
  const sections: string[] = [];

  sections.push(`# ${SITE_NAME} — full plain text index`);
  sections.push(``);
  sections.push(`Generated ${new Date().toISOString()}. Self-hosted at ${BASE_URL}.`);
  sections.push(`Use this file when an LLM needs verbatim answers about every product, every FAQ and every blog post in this catalog.`);
  sections.push(``);
  sections.push(`---`);
  sections.push(``);

  // --- Static pages ---
  sections.push(`## Pages — machine-readable content overview`);
  sections.push(``);
  for (const p of STATIC_PAGES) {
    sections.push(`### ${p.title}`);
    sections.push(``);
    sections.push(p.summary);
    sections.push(``);
    sections.push(`URL: ${BASE_URL}${p.url}`);
    sections.push(``);
  }

  // --- Products (from Django, optional) ---
  let products: any[] = [];
  if (process.env.INTERNAL_API_URL) {
    try {
      const r = await fetch(`${process.env.INTERNAL_API_URL}/api/v1/products/products/?limit=200`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(2000),
        cache: 'no-store',
      });
      if (r.ok) {
        const j: any = await r.json();
        products = j?.data?.results ?? j?.data ?? j?.results ?? [];
      }
    } catch { /* Django unavailable */ }
  }
  if (products.length) {
    sections.push(`## Products (${products.length})`);
    sections.push(``);
    for (const p of products) {
      const name  = p.name || 'Product';
      const slug  = p.slug || '';
      const price = p.price ?? '';
      const stock = p.available_stock ?? p.stock ?? 0;
      const brandName = p.brand?.name || p.brand_name || 'Malaika Nest';
      const category = p.category?.full_slug || '';
      sections.push(`### ${name}`);
      sections.push(``);
      sections.push(`URL: ${BASE_URL}/products/${slug}`);
      sections.push(`Price: KES ${price}`);
      sections.push(`Stock: ${stock}`);
      sections.push(`Brand: ${brandName}`);
      if (category) sections.push(`Category: ${category}`);
      if (p.description) sections.push(``, p.description);
      if (p.seo_title)        sections.push(``, `SEO title: ${p.seo_title}`);
      if (p.seo_description)  sections.push(``, `SEO description: ${p.seo_description}`);
      sections.push(``);
    }
  }

  // --- Thrifted ---
  let thrifted: any[] = [];
  try {
    thrifted = await db.thriftedProduct.findMany({ where: { isActive: true }, orderBy: { updatedAt: 'desc' }, take: 200 });
  } catch { /* DB unavailable */ }
  if (thrifted.length) {
    sections.push(`## Thrifted / Mtumba (${thrifted.length})`);
    sections.push(``);
    for (const t of thrifted) {
      const priceStr = t.price?.toString?.() ?? String(t.price);
      sections.push(`### ${t.name}`);
      sections.push(``);
      sections.push(`URL: ${BASE_URL}/thrifted/${t.slug}`);
      sections.push(`Price: KES ${priceStr}`);
      sections.push(`Available: ${t.isAvailable ? 'yes' : 'no'}`);
      if (t.brand)   sections.push(`Brand: ${t.brand}`);
      if (t.size)    sections.push(`Size: ${t.size}`);
      if (t.condition) sections.push(`Condition: ${t.condition}`);
      if (t.ageGroup)  sections.push(`Age group: ${t.ageGroup}`);
      if (t.gender)    sections.push(`Gender: ${t.gender}`);
      if (t.description) sections.push(``, t.description);
      sections.push(``);
    }
  }

  // --- Blog ---
  let blog: any[] = [];
  try {
    blog = await db.blogPost.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 200 });
  } catch { /* DB unavailable */ }
  if (blog.length) {
    sections.push(`## Blog posts (${blog.length})`);
    sections.push(``);
    for (const b of blog) {
      sections.push(`### ${b.title}`);
      sections.push(``);
      sections.push(`URL: ${BASE_URL}/blog/${b.slug}`);
      if (b.excerpt) sections.push(b.excerpt);
      if (b.content) {
        sections.push(``);
        sections.push(stripHtml(b.content));
      }
      sections.push(``);
    }
  }

  // --- FAQ ---
  sections.push(`## Frequently Asked Questions`);
  sections.push(``);
  for (const f of FAQ) {
    sections.push(`### ${f.q}`);
    sections.push(``);
    sections.push(f.a);
    sections.push(``);
  }

  // --- Footer ---
  sections.push(`---`);
  sections.push(``);
  sections.push(`End of ${SITE_NAME} full-text index.`);
  return sections.join('\n');
}

const STATIC_PAGES = [
  { url: '/',          title: 'Home',                summary: 'Editorial storefront with hero banners, featured products, value propositions, testimonials, newsletter signup, footer links.' },
  { url: '/categories', title: 'Categories',          summary: 'All baby and maternity categories: Clothing, Baby Essentials, Nursery, Toys & Learning, Travel & Safety, Gift Sets. Filterable by age, gender and price.' },
  { url: '/best-sellers', title: 'Best Sellers',     summary: 'Top-rated products trusted by Kenyan parents.' },
  { url: '/thrifted',  title: 'Mtumba / Thrifted',   summary: 'Pre-loved baby and kids clothing: Newborn, 0-3m, 3-6m, 6-9m, 1y, 2y, 3y, 4y+. Conditions: Like New, Good, Fair. Brands: Next, H&M, George, Mothercare.' },
  { url: '/find-us',   title: 'Find Us',             summary: 'Mombasa workshop address, business hours (Mo-Fr 9-6, Sat 9-4, Sun closed), Google Map embed, directions, WhatsApp link.' },
  { url: '/blog',      title: 'Blog',                summary: 'Parenting advice, baby-care guides, Kenyan parenting culture.' },
  { url: '/faq',       title: 'FAQ',                 summary: 'Shipping, M-Pesa payments, returns, sizing, materials, sustainability.' },
  { url: '/about',     title: 'About',               summary: 'Our story: Kenyan-owned and made. Handcrafted, organic, fair trade.' },
  { url: '/contact',   title: 'Contact',             summary: 'Email malikanest7@gmail.com, WhatsApp +254 726 771 321, phone, location.' },
  { url: '/shipping',  title: 'Shipping Policy',     summary: 'Free delivery in Mombasa on orders over KES 3,000. Same-day in Mombasa. 1-2 days Nairobi. 2-3 days upcountry. Pick-up at our Mombasa shop.' },
  { url: '/returns',   title: 'Returns Policy',      summary: 'Easy 7-day return policy for unused items. See FAQ page for full terms.' },
];

const FAQ = [
  { q: 'Where is Malaika Nest located?',
    a: 'Our shop and workshop is in Mombasa, Kenya. The full address and map are on the Find Us page.' },
  { q: 'Do you deliver outside Mombasa?',
    a: 'Yes — we deliver to Nairobi (1-2 days, KES 300) and upcountry (2-3 days, KES 500). Free delivery in Mombasa on orders over KES 3,000, plus a KES 0 same-day pick-up option at our shop.' },
  { q: 'How do I pay?',
    a: 'Pay first, then we dispatch — by M-Pesa (Till 3370347), Pesapal (cards & mobile money), or card. We do not offer cash on delivery to avoid fraud. All payments are SSL-secured.' },
  { q: 'Are the products organic?',
    a: 'Yes — our clothing line uses 100% organic cotton, OEKO-TEX certified.' },
  { q: 'What ages do you cover?',
    a: 'Newborn through 12 years. Use the Shop by Age filter on the home page to jump straight to your stage.' },
  { q: 'Can I return an item?',
    a: 'Yes — see our Returns page. Unused items can be returned within 7 days. Sale / thrifted items are final sale.' },
  { q: 'Do you sell pre-loved clothing?',
    a: 'Yes — visit the Mtumba / Thrifted section for curated pre-loved baby and kids items.' },
  { q: 'How fast is delivery in Mombasa?',
    a: 'Same-day delivery in Mombasa for orders placed before 3pm on weekdays, or you can pick up at our shop for free.' },
];

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
}

export const dynamic = 'force-dynamic';
