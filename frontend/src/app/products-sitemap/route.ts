import { NextRequest, NextResponse } from 'next/server'

const PAGE_SIZE = 1000

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://malaikanest.duckdns.org'

  try {
    const res = await fetch(
      `${apiUrl}/api/products/products/?is_active=true&page_size=${PAGE_SIZE}&page=${page}`,
      { next: { revalidate: 3600 } }
    )
    
    if (!res.ok) {
      return new NextResponse('Failed to fetch products', { status: 500 })
    }
    
    const data = await res.json()
    const unwrapped = (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data
    const products = unwrapped?.results ?? unwrapped

    const baseUrl = 'https://malaikanest.duckdns.org'

    const urls = (Array.isArray(products) ? products : []).map((p: any) => `
      <url>
        <loc>${baseUrl}/products/${p.slug}</loc>
        <lastmod>${p.updated_at ? new Date(p.updated_at).toISOString() : new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
    `).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml' },
    })
  } catch (error) {
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}
