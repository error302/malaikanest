import { NextResponse } from 'next/server';
import { getSiteSettings, getValueProps, getTestimonials } from '@/lib/settings';

/**
 * Public endpoint: returns all site branding + content blocks + value props + testimonials.
 * Used by the storefront for server-side rendering. Cached for 60s via getSiteSettings.
 *
 * GET /api/settings → { branding, content, valueProps, testimonials }
 */
export async function GET() {
  try {
    const [settings, valueProps, testimonials] = await Promise.all([
      getSiteSettings(),
      getValueProps(),
      getTestimonials(),
    ]);
    return NextResponse.json({
      branding: settings.branding,
      content: settings.content,
      valueProps,
      testimonials,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}
