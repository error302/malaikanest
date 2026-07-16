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

// Sample thrifted catalog emptied — admin uploads real mtumba items via Prisma/DB.
const SAMPLE_THRIFTED: ThriftedProduct[] = [];

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
