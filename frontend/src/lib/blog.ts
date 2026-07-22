/**
 * Blog post data fetchers — reads from the local Prisma DB (blog_posts table).
 * Falls back to sample posts when the table is empty.
 */
import { db } from '@/lib/db';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string;
  author: string;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const SAMPLE_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: '5 Organic Cotton Benefits for Your Baby\'s Skin',
    slug: '5-organic-cotton-benefits-for-baby-skin',
    excerpt: 'Discover why organic cotton is the safest choice for your little one\'s delicate skin — and how to spot the real deal.',
    content: `# 5 Organic Cotton Benefits for Your Baby's Skin\n\nWhen it comes to your baby's delicate skin, every fabric choice matters. Here's why organic cotton is worth the investment.\n\n## 1. No Harmful Chemicals\n\nOrganic cotton is grown without synthetic pesticides, fertilizers, or genetically modified seeds. This means no toxic residue touches your baby's skin.\n\n## 2. Softer and Breathable\n\nThe fibers are longer and smoother, making the fabric incredibly soft. It also breathes better, reducing the risk of heat rash.\n\n## 3. Hypoallergenic\n\nIdeal for babies with eczema, allergies, or sensitive skin. Organic cotton naturally resists dust mites and mold.\n\n## 4. Better for the Planet\n\nOrganic farming uses 91% less water than conventional cotton and promotes healthy soil.\n\n## 5. Durability\n\nOrganic cotton lasts longer — perfect for hand-me-downs and the mtumba market!\n\n---\n\n*Shop our [organic cotton collection](/categories) — handcrafted with love in Kenya.*`,
    coverImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80&auto=format&fit=crop',
    category: 'Baby Care',
    tags: 'organic, cotton, skincare, newborn',
    author: 'Malaika Nest',
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'b2',
    title: 'The Ultimate Baby Shower Gift Guide (Kenyyan Edition)',
    slug: 'ultimate-baby-shower-gift-guide-kenya',
    excerpt: 'From practical essentials to thoughtful keepsakes — here are the best baby shower gifts for Kenyan mums-to-be.',
    content: `# The Ultimate Baby Shower Gift Guide\n\nStruggling to find the perfect baby shower gift? We've got you covered.\n\n## Under KES 1,000\n\n- **Organic onesies (3-pack)** — always useful\n- **Swaddle blankets** — soft, multipurpose\n- **Knitted booties** — adorable and warm\n\n## KES 1,000 - 3,000\n\n- **Baby care hamper** — a curated bundle\n- **Premium swaddle set** — terracotta or sage\n- **Wooden teething toys** — natural and safe\n\n## KES 3,000+\n\n- **Deluxe newborn gift box** — the wow factor\n- **Baby carrier** — hands-free cuddles\n- **Organic cotton layette** — full wardrobe\n\n---\n\n*Browse our [gift sets](/categories) — beautifully packaged and ready to gift.*`,
    coverImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&q=80&auto=format&fit=crop',
    category: 'Gift Guides',
    tags: 'gifts, baby shower, kenya',
    author: 'Malaika Nest',
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'b3',
    title: 'How to Care for Mtumba (Thrifted) Baby Clothes',
    slug: 'how-to-care-for-thrifted-baby-clothes',
    excerpt: 'Got a great deal on pre-loved baby clothes? Here\'s how to sanitize, refresh, and make them last.',
    content: `# Caring for Thrifted Baby Clothes\n\nMtumba finds are treasures — here's how to make them shine.\n\n## Step 1: Sanitize\n\nWash in hot water (60°C) with baby-safe detergent. Add white vinegar to the rinse cycle for extra sanitization.\n\n## Step 2: Inspect\n\nCheck seams, zippers, and buttons. A loose thread is an easy fix; a broken zipper needs replacing.\n\n## Step 3: Stain Treatment\n\nFor organic stains (milk, food), use a paste of baking soda and water. For set-in stains, try hydrogen peroxide.\n\n## Step 4: Freshen\n\nAir dry in sunlight — UV rays naturally kill bacteria and brighten whites.\n\n## Step 5: Store\n\nFold with cedar blocks (natural moth repellent) in a cool, dry place.\n\n---\n\n*Discover unique [mtumba finds](/thrifted) — premium brands at a fraction of the price.*`,
    coverImage: 'https://images.unsplash.com/photo-1547558348-5e83b15a4220?w=1200&q=80&auto=format&fit=crop',
    category: 'Parenting',
    tags: 'mtumba, thrifted, care, laundry',
    author: 'Malaika Nest',
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

function normalize(row: any): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    content: row.content || '',
    coverImage: row.coverImage || undefined,
    category: row.category || 'General',
    tags: row.tags || '',
    author: row.author || 'Malaika Nest',
    isPublished: row.isPublished,
    isFeatured: row.isFeatured,
    publishedAt: row.publishedAt?.toISOString?.() || (row.publishedAt ? String(row.publishedAt) : undefined),
    createdAt: row.createdAt?.toISOString?.() || String(row.createdAt || new Date().toISOString()),
    updatedAt: row.updatedAt?.toISOString?.() || String(row.updatedAt || new Date().toISOString()),
  };
}

export async function getPublishedPosts(limit = 12): Promise<BlogPost[]> {
  try {
    if (db && db.blogPost) {
      const rows = await db.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      });
      if (rows.length > 0) return rows.map(normalize);
    }
  } catch {
    // fall through to sample
  }
  return SAMPLE_POSTS.slice(0, limit);
}

export async function getFeaturedPosts(limit = 3): Promise<BlogPost[]> {
  try {
    if (db && db.blogPost) {
      const rows = await db.blogPost.findMany({
        where: { isPublished: true, isFeatured: true },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      });
      if (rows.length > 0) return rows.map(normalize);
    }
  } catch {
    // fall through to sample
  }
  return SAMPLE_POSTS.filter((p) => p.isFeatured).slice(0, limit);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    if (db && db.blogPost) {
      const row = await db.blogPost.findUnique({ where: { slug } });
      if (row) return normalize(row);
    }
  } catch {
    // fall through to sample
  }
  return SAMPLE_POSTS.find((p) => p.slug === slug) || null;
}

export async function getCategories(): Promise<string[]> {
  try {
    if (db && db.blogPost) {
      const rows = await db.blogPost.findMany({
        where: { isPublished: true },
        select: { category: true },
        distinct: ['category'],
      });
      if (rows.length > 0) return rows.map((r) => r.category);
    }
  } catch {
    // fall through to sample
  }
  return Array.from(new Set(SAMPLE_POSTS.map((p) => p.category)));
}
