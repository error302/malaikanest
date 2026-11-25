"""robots.txt and sitemap.xml for the server-rendered storefront.

Hand-rolled (no django.contrib.sites/sitemaps) so the lean deployment needs
no extra apps or migrations. Both views are cheap: one indexed query each.
"""

from django.conf import settings
from django.http import HttpResponse
from django.urls import reverse

from apps.products.models import Category, Product

from .views import PUBLIC_STATUS


def robots_txt(request):
    lines = [
        "User-agent: *",
        "Allow: /",
        f"Disallow: /{settings.ADMIN_URL_PREFIX}/",
        "Disallow: /manage/",
        "Disallow: /account/",
        "Disallow: /cart/",
        "Disallow: /checkout/",
        "Disallow: /saved/",
        "",
        f"Sitemap: {request.build_absolute_uri('/sitemap.xml')}",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain; charset=utf-8")


def _xml_escape(value: str) -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def sitemap_xml(request):
    base = request.build_absolute_uri("/").rstrip("/")
    urls = [(f"{base}{reverse('storefront:home')}", None)]

    products = (
        Product.objects.filter(is_active=True, status=PUBLIC_STATUS)
        .prefetch_related("category")
        .order_by("pk")
    )
    for product in products:
        loc = f"{base}{reverse('storefront:product_detail', args=[product.slug])}"
        lastmod = getattr(product, "updated_at", None) or getattr(product, "created_at", None)
        urls.append((loc, lastmod))

    categories = Category.objects.filter(parent__isnull=True).exclude(slug="shop-photo-review")
    for category in categories:
        loc = f"{base}{reverse('storefront:category_detail', args=[category.slug])}"
        urls.append((loc, None))

    body = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for loc, lastmod in urls:
        body.append("  <url>")
        body.append(f"    <loc>{_xml_escape(loc)}</loc>")
        if lastmod:
            body.append(f"    <lastmod>{lastmod:%Y-%m-%d}</lastmod>")
        body.append("  </url>")
    body.append("</urlset>")

    return HttpResponse("\n".join(body), content_type="application/xml; charset=utf-8")
