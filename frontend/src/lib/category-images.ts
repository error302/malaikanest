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

/** Curated defaults, keyed by category slug. */
const SLUG_IMAGES: Record<string, string> = {
  'baby-clothing': '/images/categories/baby-clothing.jpg',
  'clothing': '/images/categories/clothing.jpg',
  'baby-essentials': '/images/categories/baby-essentials.jpg',
  'nursery': '/images/categories/nursery.jpg',
  'nursery-gear': '/images/categories/nursery-gear.jpg',
  'toys': '/images/categories/toys.jpg',
  'toys-gifts': '/images/categories/toys-gifts.jpg',
  'gifts': '/images/categories/gifts.jpg',
  'travel': '/images/categories/travel.jpg',
  'thrifted': '/images/categories/thrifted.jpg',
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

  // 2. Curated slug mapping (covers the known catalog categories).
  if (cat.slug && SLUG_IMAGES[cat.slug]) {
    return SLUG_IMAGES[cat.slug];
  }

  // 3. Loose name-keyword match against the curated map.
  const name = (cat.name || '').toLowerCase();
  if (name) {
    const hit = Object.entries(SLUG_IMAGES).find(([slug, _img]) =>
      name.includes(slug.replace(/-/g, ' ')),
    );
    if (hit) return hit[1];
  }

  // 4. Deterministic generic fallback (stable per category).
  const key = cat.slug || cat.name || 'fallback';
  return GENERIC_IMAGES[hashCode(key) % GENERIC_IMAGES.length];
}
