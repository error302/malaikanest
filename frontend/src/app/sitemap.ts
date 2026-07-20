import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/site-config';

const BASE_URL = SITE_URL;

/**
 * Dynamic sitemap — includes all static pages, plus product and thrifted URLs
 * from the database so new items are indexed automatically.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/categories`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/thrifted`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/best-sellers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/track`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/find-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/returns`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/wishlist`, lastModified: now, changeFrequency: 'weekly', priority: 0.3 },
    { url: `${BASE_URL}/cart`, lastModified: now, changeFrequency: 'weekly', priority: 0.3 },
  ];

  // Thrifted products (from local Prisma DB)
  let thriftedUrls: MetadataRoute.Sitemap = [];
  try {
    const thrifted = await db.thriftedProduct.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    thriftedUrls = thrifted.map((t) => ({
      url: `${BASE_URL}/thrifted/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch {
    // DB not available — skip
  }

  // Blog posts
  let blogUrls: MetadataRoute.Sitemap = [];
  try {
    const posts = await db.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true, publishedAt: true },
    });
    blogUrls = posts.map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.publishedAt || p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
  } catch {
    // DB not available — skip
  }

  // Django-side products (best-effort, never fails the build)
  let productUrls: MetadataRoute.Sitemap = [];
  if (process.env.INTERNAL_API_URL) {
    try {
      const r = await fetch(`${process.env.INTERNAL_API_URL}/api/v1/products/products/?limit=200&status=published`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(2500),
        cache: 'no-store',
      });
      if (r.ok) {
        const j: any = await r.json();
        const results: any[] = j?.data?.results ?? j?.data ?? j?.results ?? [];
        productUrls = results
          .filter((p) => p.slug)
          .map((p) => ({
            url: `${BASE_URL}/products/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : now,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          }));
      }
    } catch {
      // backend offline — skip
    }
  }

  return [...staticPages, ...productUrls, ...thriftedUrls, ...blogUrls];
}
