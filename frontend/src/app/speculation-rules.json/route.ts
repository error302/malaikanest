import { NextRequest, NextResponse } from "next/server";

// Speculation Rules: prefetch the full document for product pages when the
// user signals intent (pointerdown / hover — "conservative"), so taps feel
// instant without wasting mobile data on idle viewport prefetching. Next's
// <Link> continues to prefetch RSC payloads as usual; this layer adds
// document-level warmth for dynamic routes.
const rules = {
  prefetch: [
    {
      where: { href_matches: "/products/*" },
      eagerness: "conservative",
    },
    {
      where: {
        or: [{ href_matches: "/categories" }, { href_matches: "/categories/*" }],
      },
      eagerness: "conservative",
    },
  ],
};

export async function GET(_request: NextRequest) {
  return new NextResponse(JSON.stringify(rules), {
    status: 200,
    headers: {
      "Content-Type": "application/speculationrules+json",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
