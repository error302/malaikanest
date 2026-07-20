/**
 * Seed the CMS tables with default content so the admin has a starting point.
 * Run with: bun run /home/z/my-project/scripts/seed-cms.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BRANDING_DEFAULTS = [
  { key: 'store_name', value: 'Malaika Nest' },
  { key: 'tagline', value: 'Baby & Maternity' },
  { key: 'footer_tagline', value: 'Handcrafted organic clothing, accessories & toys made with love in Kenya. For little ones aged 0–12 years.' },
  { key: 'primary_color', value: '#8B6914' },
  { key: 'accent_color', value: '#C4704A' },
  { key: 'announcement_messages', value: JSON.stringify([
    'Free delivery on orders over <strong>KES 3,000</strong>',
    'Same-day delivery in Mombasa',
    'Lipa Na M-Pesa · Till 3370347',
    'Handcrafted with love in Kenya',
  ]) },
  { key: 'contact_email', value: 'hello@malaikanest.com' },
  { key: 'contact_phone', value: '+254726771321' },
  { key: 'mpesa_till', value: '3370347' },
  { key: 'whatsapp_url', value: 'https://wa.me/254726771321' },
  { key: 'facebook_url', value: 'https://facebook.com' },
  { key: 'instagram_url', value: 'https://instagram.com' },
  { key: 'location', value: 'Mombasa, Kenya' },
  { key: 'copyright_name', value: 'Malaika Nest' },
];

const CONTENT_DEFAULTS = [
  { section: 'hero', key: 'slide1_tag', value: 'Premium Baby Care' },
  { section: 'hero', key: 'slide1_headline', value: 'A Premium Nest' },
  { section: 'hero', key: 'slide1_highlight', value: 'for Little Ones' },
  { section: 'hero', key: 'slide1_sub', value: 'Handcrafted organic clothing, accessories & toys made with love in Kenya. For ages 0–12 years.' },
  { section: 'hero', key: 'slide1_cta', value: 'Shop Newborn' },
  { section: 'hero', key: 'slide2_tag', value: 'Organic Collection' },
  { section: 'hero', key: 'slide2_headline', value: 'Organic Cotton' },
  { section: 'hero', key: 'slide2_highlight', value: 'for Soft Skin' },
  { section: 'hero', key: 'slide2_sub', value: 'Gentle, breathable fabrics made from 100% organic cotton. Perfect for your baby\'s delicate skin.' },
  { section: 'hero', key: 'slide2_cta', value: 'Shop Clothing' },
  { section: 'hero', key: 'slide3_tag', value: 'Gift Ideas' },
  { section: 'hero', key: 'slide3_headline', value: 'The Perfect' },
  { section: 'hero', key: 'slide3_highlight', value: 'Baby Gift' },
  { section: 'hero', key: 'slide3_sub', value: 'Beautifully curated gift sets for baby showers, newborns and special milestones.' },
  { section: 'hero', key: 'slide3_cta', value: 'Browse Gifts' },
  { section: 'shop_by_age', key: 'label', value: 'Find the perfect size' },
  { section: 'shop_by_age', key: 'title', value: 'Shop by Age' },
  { section: 'shop_by_age', key: 'subtitle', value: 'From newborn snuggles to first-day-of-school fits — we\'ve got every stage covered.' },
  { section: 'categories', key: 'label', value: 'Browse collections' },
  { section: 'categories', key: 'title', value: 'Curated Categories' },
  { section: 'categories', key: 'subtitle', value: 'Thoughtfully selected for every moment of your baby\'s journey.' },
  { section: 'featured', key: 'label', value: 'Hand-picked' },
  { section: 'featured', key: 'title', value: 'Featured Products' },
  { section: 'featured', key: 'view_all', value: 'View All' },
  { section: 'best_sellers', key: 'label', value: 'Most loved' },
  { section: 'best_sellers', key: 'title', value: 'Best Sellers' },
  { section: 'best_sellers', key: 'view_all', value: 'See More' },
  { section: 'new_arrivals', key: 'label', value: 'Just landed' },
  { section: 'new_arrivals', key: 'title', value: 'New Arrivals' },
  { section: 'new_arrivals', key: 'view_all', value: 'Shop New' },
  { section: 'testimonials', key: 'label', value: 'Loved by parents' },
  { section: 'testimonials', key: 'title', value: 'What Families Are Saying' },
  { section: 'testimonials', key: 'aggregate_rating', value: '4.9 / 5 · 1,200+ reviews' },
  { section: 'newsletter', key: 'badge', value: 'Join the Nest' },
  { section: 'newsletter', key: 'title', value: 'Get 10% off your first order' },
  { section: 'newsletter', key: 'subtitle', value: 'Subscribe for new arrivals, exclusive offers and parenting tips — straight to your inbox.' },
  { section: 'newsletter', key: 'cta', value: 'Subscribe' },
  { section: 'newsletter', key: 'placeholder', value: 'you@email.com' },
  { section: 'newsletter', key: 'disclaimer', value: 'No spam, only love. Unsubscribe anytime.' },
  { section: 'newsletter', key: 'success_message', value: 'Subscribed' },
];

const VALUE_PROPS_DEFAULTS = [
  { icon: 'Shield', title: 'Safe Materials', subtitle: 'OEKO-TEX certified, tested for your baby', position: 0 },
  { icon: 'Truck', title: 'Fast Delivery', subtitle: 'Same-day in Mombasa, 1–3 days countrywide', position: 1 },
  { icon: 'Heart', title: 'Parent Approved', subtitle: 'Trusted by 5,000+ Kenyan families', position: 2 },
  { icon: 'CreditCard', title: 'Secure M-Pesa', subtitle: 'Till 3370347 · Pay safely, every time', position: 3 },
];

const TESTIMONIALS_DEFAULTS = [
  { name: 'Amina W.', location: 'Mombasa', rating: 5, text: 'The organic cotton onesies are incredibly soft. My baby\'s skin has never been happier. Same-day delivery was a lifesaver!', product: 'Organic Newborn Set', initials: 'AW', position: 0 },
  { name: 'Grace M.', location: 'Nairobi', rating: 5, text: 'I ordered the gift set for my sister\'s baby shower and it was beautifully packaged. The quality exceeded my expectations.', product: 'Baby Shower Gift Bundle', initials: 'GM', position: 1 },
  { name: 'Joy K.', location: 'Kisumu', rating: 5, text: 'Finally a Kenyan baby shop that gets it right. Premium quality, fair prices, and the M-Pesa checkout was instant.', product: 'Toddler Clothing Pack', initials: 'JK', position: 2 },
];

async function main() {
  console.log('Seeding CMS defaults...');

  for (const b of BRANDING_DEFAULTS) {
    await prisma.siteSetting.upsert({ where: { key: b.key }, update: {}, create: b });
  }
  console.log(`✓ Seeded ${BRANDING_DEFAULTS.length} branding settings`);

  for (const c of CONTENT_DEFAULTS) {
    await prisma.contentBlock.upsert({
      where: { section_key: { section: c.section, key: c.key } },
      update: {},
      create: { ...c, isActive: true },
    });
  }
  console.log(`✓ Seeded ${CONTENT_DEFAULTS.length} content blocks`);

  for (const v of VALUE_PROPS_DEFAULTS) {
    await prisma.valueProp.create({ data: { ...v, isActive: true } }).catch(() => {});
  }
  console.log(`✓ Seeded ${VALUE_PROPS_DEFAULTS.length} value props`);

  for (const t of TESTIMONIALS_DEFAULTS) {
    await prisma.testimonial.create({ data: { ...t, isActive: true } }).catch(() => {});
  }
  console.log(`✓ Seeded ${TESTIMONIALS_DEFAULTS.length} testimonials`);

  console.log('\n✅ CMS seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
