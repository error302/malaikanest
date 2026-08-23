/**
 * Category image resolution for the storefront.
 *
 * Priorities (highest first):
 *   1. The category's OWN real image (`cat.image`), uploaded by the admin via
 *      /admin/categories — this is the definitive, correct image.
 *   2. A curated, thematically-matched image keyed by category slug — used as a
 *      sensible default so a category never shows an unrelated generic photo.
 *   3. A deterministic generic fallback (same category → same image).
 *
 * IMPORTANT: This replaces the old behaviour that picked an image purely by
 * list index, which made every category show an unrelated photo.
 */

export interface CategoryImageLike {
  name?: string;
  slug?: string;
  image?: string | null;
}

/** Curated defaults, keyed by category slug or keyword. */
const SLUG_IMAGES: Record<string, string> = {
  'baby-clothing': '/images/categories/baby-clothing.jpg',
  'clothing': '/images/categories/clothing.jpg',
  'toddler-clothing': '/images/categories/clothing.jpg',
  'dresses': '/images/categories/clothing.jpg',
  'hoodies': '/images/categories/clothing.jpg',
  'jackets': '/images/categories/clothing.jpg',
  'jeans': '/images/categories/clothing.jpg',
  'pajamas': '/images/categories/clothing.jpg',
  'pants': '/images/categories/clothing.jpg',
  'shorts': '/images/categories/clothing.jpg',
  'skirts': '/images/categories/clothing.jpg',
  'sweaters': '/images/categories/clothing.jpg',
  't-shirts': '/images/categories/clothing.jpg',
  'school-wear': '/images/categories/clothing.jpg',
  'sportswear': '/images/categories/clothing.jpg',
  'boys': '/images/categories/clothing.jpg',
  'girls': '/images/categories/clothing.jpg',
  'baby': '/images/categories/baby-clothing.jpg',
  'toddler': '/images/categories/clothing.jpg',
  'kids': '/images/categories/clothing.jpg',
  'baby-essentials': '/images/categories/baby-essentials.jpg',
  'essentials': '/images/categories/baby-essentials.jpg',
  'feeding': '/images/categories/baby-essentials.jpg',
  'diapering': '/images/categories/baby-essentials.jpg',
  'bath-baby-care': '/images/categories/baby-essentials.jpg',
  'baby-health': '/images/categories/baby-essentials.jpg',
  'nursery': '/images/categories/nursery.jpg',
  'nursery-gear': '/images/categories/nursery-gear.jpg',
  'gear': '/images/categories/nursery-gear.jpg',
  'cribs': '/images/categories/nursery.jpg',
  'bedding': '/images/categories/nursery.jpg',
  'mattresses': '/images/categories/nursery.jpg',
  'changing-tables': '/images/categories/nursery.jpg',
  'nursery-decor': '/images/categories/nursery.jpg',
  'safety-gates': '/images/categories/nursery-gear.jpg',
  'toys': '/images/categories/toys.jpg',
  'toys-learning': '/images/categories/toys.jpg',
  'toys-gifts': '/images/categories/toys-gifts.jpg',
  'activity-toys': '/images/categories/toys.jpg',
  'bath-toys': '/images/categories/toys.jpg',
  'educational': '/images/categories/toys.jpg',
  'soft-toys': '/images/categories/toys.jpg',
  'teething-toys': '/images/categories/toys.jpg',
  'gifts': '/images/categories/gifts.jpg',
  'gifts-bundles': '/images/categories/gifts.jpg',
  'bundles': '/images/categories/gifts.jpg',
  'baby-gift-sets': '/images/categories/gifts.jpg',
  'baby-shower-gifts': '/images/categories/gifts.jpg',
  'newborn-starter-kits': '/images/categories/gifts.jpg',
  'travel': '/images/categories/travel.jpg',
  'strollers': '/images/categories/travel.jpg',
  'car-seats': '/images/categories/travel.jpg',
  'walkers': '/images/categories/travel.jpg',
  'baby-carriers': '/images/categories/travel.jpg',
  'thrifted': '/images/categories/thrifted.jpg',
  'mtumba': '/images/categories/thrifted.jpg',
};

/** Last-resort generic images. */
const GENERIC_IMAGES = [
  '/images/categories/baby-clothing.jpg',
  '/images/categories/clothing.jpg',
  '/images/categories/baby-essentials.jpg',
  '/images/categories/nursery.jpg',
  '/images/categories/toys.jpg',
  '/images/categories/gifts.jpg',
];

function hashCode(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getCategoryImage(cat: CategoryImageLike | null | undefined): string {
  if (!cat) return GENERIC_IMAGES[0];

  // 1. Prefer the real admin-uploaded image.
  if (typeof cat.image === 'string' && cat.image.trim()) {
    return cat.image;
  }

  // 2. Direct slug match.
  const slug = (cat.slug || '').toLowerCase().trim();
  if (slug && SLUG_IMAGES[slug]) {
    return SLUG_IMAGES[slug];
  }

  // 3. Normalized name/slug keyword match.
  const name = (cat.name || '').toLowerCase().trim();
  const searchString = `${slug} ${name}`;

  if (searchString.includes('cloth') || searchString.includes('dress') || searchString.includes('romper') || searchString.includes('onesie') || searchString.includes('boy') || searchString.includes('girl')) {
    return '/images/categories/baby-clothing.jpg';
  }
  if (searchString.includes('toy') || searchString.includes('play') || searchString.includes('game') || searchString.includes('puzzle')) {
    return '/images/categories/toys.jpg';
  }
  if (searchString.includes('nursery') || searchString.includes('crib') || searchString.includes('bed') || searchString.includes('decor')) {
    return '/images/categories/nursery.jpg';
  }
  if (searchString.includes('essential') || searchString.includes('feed') || searchString.includes('bib') || searchString.includes('diaper') || searchString.includes('bath') || searchString.includes('care')) {
    return '/images/categories/baby-essentials.jpg';
  }
  if (searchString.includes('gift') || searchString.includes('bundle') || searchString.includes('shower') || searchString.includes('set')) {
    return '/images/categories/gifts.jpg';
  }
  if (searchString.includes('travel') || searchString.includes('stroller') || searchString.includes('carrier') || searchString.includes('seat')) {
    return '/images/categories/travel.jpg';
  }
  if (searchString.includes('thrift') || searchString.includes('mtumba') || searchString.includes('preloved')) {
    return '/images/categories/thrifted.jpg';
  }

  // 4. Fallback from generic pool.
  const key = slug || name || 'fallback';
  return GENERIC_IMAGES[hashCode(key) % GENERIC_IMAGES.length];
}
