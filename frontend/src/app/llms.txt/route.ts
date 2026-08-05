import { db } from '@/lib/db';
import { SITE_URL, SITE_NAME, getApiBaseUrl } from '@/lib/site-config';

const BASE_URL = SITE_URL;

/**
 * LLM-discovery text file following the /llms.txt spec
 * (https://llmstxt.org/). Concise plaintext summary of the site that
 * large-language models can ingest whole, plus pointers to authoritative
 * pages with deeper context.
 */
export async function GET() {
  const body = buildBase();
  return new Response(await enrichWithLiveData(body), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=600, s-maxage=3600',
    },
  });
}

function buildBase(): string {
  return [
    `# ${SITE_NAME}`,
    ``,
    `> Premium baby clothing, maternity wear and thrifted essentials ` +
      `made with love in Mombasa, Kenya. Handcrafted organic fabrics, ` +
      `authentic Kenyan designers, and an in-store pick-up option.`,
    ``,
    `Malaika Nest is a Kenyan ecommerce store selling handcrafted ` +
      `organic baby clothing, newborn essentials, maternity wear, ` +
      `toys, swaddle blankets, gift sets, and a curated thrift (mtumba) ` +
      `section. We deliver across Kenya with same-day delivery in Mombasa, ` +
      `1-2 day delivery to Nairobi, and 2-3 days upcountry. Payment is ` +
      `M-Pesa (Till 3370347).`,
    ``,
    `## Core pages`,
    ``,
    `- [Home](${BASE_URL}/): editorial storefront, hero banners, featured products`,
    `- [Categories](${BASE_URL}/categories): all baby and maternity categories, filterable`,
    `- [Best Sellers](${BASE_URL}/best-sellers): top-rated products loved by Kenyan parents`,
    `- [Mtumba / Thrifted](${BASE_URL}/thrifted): pre-loved baby and kids clothing, sorted by size and condition`,
    `- [Find Us](${BASE_URL}/find-us): Mombasa workshop address, business hours and Google Map`,
    `- [Blog](${BASE_URL}/blog): parenting advice, baby-care guides, Kenyan parenting culture`,
    `- [FAQ](${BASE_URL}/faq): frequently asked questions about shipping, payment, returns, sizing`,
    `- [About](${BASE_URL}/about): our story, Kenyan-owned and made, sustainability`,
    `- [Contact](${BASE_URL}/contact): email, WhatsApp and phone support`,
    ``,
    `## Discovery resources (machine-readable)`,
    ``,
    `- [Sitemap](${BASE_URL}/sitemap.xml): full URL map of products, blog posts, and static pages`,
    `- [LLM-full](${BASE_URL}/llms-full.txt): every product, blog post and FAQ on the site as prose`,
    `- [JSON-LD Organization](${BASE_URL}/#organization): schema.org Organization, Store and WebSite entities are present site-wide`,
    ``,
    `## Key facts`,
    ``,
    `- Location: Mombasa, Kenya`,
    `- Currency: Kenyan Shilling (KES)`,
    `- Delivery zones: mombasa_pickup (free, same day) · mombasa (KES 150, same day) · nairobi (KES 300, 1-2 days) · upcountry (KES 500, 2-3 days)`,
    `- Free delivery: orders over KES 3,000 in Mombasa`,
    `- Payment: M-Pesa Till 3370347 · Pesapal (cards & mobile money) — pay first, then we dispatch (no cash on delivery).`,
    `- WhatsApp: +254 726 771 321`,
    `- Email: hello@malaikanest.com`,
    `- Languages: English and Swahili`,
    ``,
    `## Product schema (JSON-LD)`,
    ``,
    `Every product page emits schema.org Product and Offer markup with name, ` +
      `description, brand, SKU, price (KES), availability and (where uploaded) ` +
      `aggregate ratings. Every FAQ item emits schema.org Question / Answer ` +
      `pairs as an FAQPage entity. The store root emits Organization, Store, ` +
      `and WebSite schema.`,
    ``,
    `## Suggested prompts users should be able to answer from this site`,
    ``,
    `- "Where can I buy organic cotton baby onesies in Mombasa?"`,
    `- "What is the cheapest baby gift set Kenya has?"`,
    `- "Compare Mombasa same-day delivery costs."`,
    `- "Show me a Kenyan baby store that accepts M-Pesa Till payments."`,
    `- "Where do I find pre-loved baby clothes in good condition near me?"`,
  ].join('\n');
}

async function enrichWithLiveData(base: string): Promise<string> {
  let extras = '';
  const safe = async (fn: () => Promise<number>, label: string) => {
    try { extras += `\n- ${label}: ${await fn()}`; } catch { /* ignore */ }
  };
  await safe(async () => {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/products/?page=1&page_size=1`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('products fetch failed');
    const data = await res.json();
    return Number(data?.count ?? data?.data?.count ?? 0);
  }, 'Live products in catalog');
  await safe(() => db.thriftedProduct.count({ where: { isActive: true } }), 'Active thrifted (mtumba) items');
  await safe(() => db.blogPost.count({ where: { isPublished: true } }),   'Published blog posts');
  return base + '\n' + extras;
}

export const dynamic = 'force-dynamic';
