/**
 * Thrifted (Mtumba) product data fetchers.
 * Reads from the local Prisma DB (thrifted_products table).
 * Falls back to sample data when the table is empty.
 */
import { db } from '@/lib/db';

export interface ThriftedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  condition: 'like_new' | 'good' | 'fair';
  brand: string;
  size: string;
  gender: string;
  ageGroup: string;
  image: string;
  image2?: string;
  image3?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export const CONDITION_LABELS: Record<string, string> = {
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
};

export const CONDITION_COLORS: Record<string, string> = {
  like_new: 'var(--brand-green-light)',
  good: 'var(--brand-gold)',
  fair: 'var(--brand-terra)',
};

const SAMPLE_THRIFTED: ThriftedProduct[] = [
  {
    id: 't1',
    name: 'Next Baby Romper — Striped (0-3m)',
    slug: 'next-baby-romper-striped-0-3m',
    description: 'Gently used Next romper in excellent condition. Soft cotton, no stains or tears. Perfect for everyday wear.',
    price: 450,
    originalPrice: 1800,
    condition: 'like_new',
    brand: 'Next',
    size: '0-3m',
    gender: 'unisex',
    ageGroup: 'baby',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80&auto=format&fit=crop',
    isAvailable: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 't2',
    name: 'H&M Toddler Dress — Floral (2y)',
    slug: 'hm-toddler-dress-floral-2y',
    description: 'Adorable floral dress from H&M. Worn a handful of times, minor fade on print. Still lots of life left!',
    price: 350,
    originalPrice: 1500,
    condition: 'good',
    brand: 'H&M',
    size: '2y',
    gender: 'girl',
    ageGroup: 'toddler',
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&q=80&auto=format&fit=crop',
    isAvailable: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 't3',
    name: 'George Snowsuit — Navy (6-9m)',
    slug: 'george-snowsuit-navy-6-9m',
    description: 'Warm winter snowsuit from George (Asda). Great for cold Mombasa mornings or upcountry trips. Zip works perfectly.',
    price: 800,
    originalPrice: 3500,
    condition: 'like_new',
    brand: 'George',
    size: '6-9m',
    gender: 'boy',
    ageGroup: 'baby',
    image: 'https://images.unsplash.com/photo-1547558348-5e83b15a4220?w=600&q=80&auto=format&fit=crop',
    isAvailable: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 't4',
    name: 'Mothercare Cardigan — Cream (4y)',
    slug: 'mothercare-cardigan-cream-4y',
    description: 'Soft knit cardigan from Mothercare. One small button replaced (matching). Warm and cozy for chilly evenings.',
    price: 550,
    originalPrice: 2200,
    condition: 'good',
    brand: 'Mothercare',
    size: '4y',
    gender: 'unisex',
    ageGroup: 'kids',
    image: 'https://images.unsplash.com/photo-1503944168849-8bf86875b08c?w=600&q=80&auto=format&fit=crop',
    isAvailable: true,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
];

function normalize(row: any): ThriftedProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    price: typeof row.price === 'object' ? Number(row.price) : Number(row.price),
    originalPrice: row.originalPrice ? (typeof row.originalPrice === 'object' ? Number(row.originalPrice) : Number(row.originalPrice)) : undefined,
    condition: row.condition || 'good',
    brand: row.brand || '',
    size: row.size || '',
    gender: row.gender || 'unisex',
    ageGroup: row.ageGroup || '',
    image: row.image,
    image2: row.image2 || undefined,
    image3: row.image3 || undefined,
    isAvailable: row.isAvailable,
    isFeatured: row.isFeatured,
    createdAt: row.createdAt?.toISOString?.() || String(row.createdAt || new Date().toISOString()),
  };
}

/** Get featured thrifted items for the homepage section. */
export async function getFeaturedThrifted(limit = 4): Promise<ThriftedProduct[]> {
  try {
    const rows = await db.thriftedProduct.findMany({
      where: { isFeatured: true, isAvailable: true, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    if (rows.length > 0) return rows.map(normalize);
    // Fallback: any available thrifted items
    const anyRows = await db.thriftedProduct.findMany({
      where: { isAvailable: true, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    if (anyRows.length > 0) return anyRows.map(normalize);
    return SAMPLE_THRIFTED.slice(0, limit);
  } catch {
    return SAMPLE_THRIFTED.slice(0, limit);
  }
}

/** Get all available thrifted items for the browse page (with optional filters). */
export async function getThriftedProducts(filters?: {
  condition?: string;
  gender?: string;
  ageGroup?: string;
  search?: string;
}): Promise<ThriftedProduct[]> {
  try {
    const where: any = { isAvailable: true, isActive: true };
    if (filters?.condition) where.condition = filters.condition;
    if (filters?.gender && filters.gender !== 'all') where.gender = filters.gender;
    if (filters?.ageGroup && filters.ageGroup !== 'all') where.ageGroup = filters.ageGroup;
    if (filters?.search) where.name = { contains: filters.search };

    const rows = await db.thriftedProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    if (rows.length > 0) return rows.map(normalize);
    return SAMPLE_THRIFTED;
  } catch {
    return SAMPLE_THRIFTED;
  }
}

/** Get a single thrifted product by slug. */
export async function getThriftedBySlug(slug: string): Promise<ThriftedProduct | null> {
  try {
    const row = await db.thriftedProduct.findUnique({ where: { slug } });
    if (!row) return null;
    return normalize(row);
  } catch {
    return SAMPLE_THRIFTED.find((t) => t.slug === slug) || null;
  }
}
