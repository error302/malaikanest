from django.core.cache import cache  # noqa: F401 (kept for future use)

import logging

from apps.core.models import SiteSettings
from apps.orders.models import Cart
from apps.products.models import Category

from django.db import models
from django.utils import timezone

logger = logging.getLogger(__name__)

# Shared age-size taxonomy (slugs are consumed by ProductListView ?age= filter).
AGE_GROUPS = [
    {"label": "Newborn", "slug": "newborn"},
    {"label": "0–3 months", "slug": "0-3m"},
    {"label": "3–6 months", "slug": "3-6m"},
    {"label": "6–12 months", "slug": "6-12m"},
    {"label": "1–2 years", "slug": "1-2y"},
    {"label": "2–4 years", "slug": "2-4y"},
    {"label": "4–6 years", "slug": "4-6y"},
    {"label": "6–8 years", "slug": "6-8y"},
    {"label": "8–10 years", "slug": "8-10y"},
    {"label": "10–12 years", "slug": "10-12y"},
]


def storefront_context(request):
    """Global context for Malaika Nest storefront templates."""
    categories = Category.storefront_roots()[:10]

    # Active hero banner (editable from the admin dashboard: Banners section)
    active_banner = None
    try:
        from apps.products.models import Banner
        active_banner = (
            Banner.objects.filter(is_active=True)
            .filter(
                models.Q(start_date__isnull=True) | models.Q(start_date__lte=timezone.now())
            )
            .filter(
                models.Q(end_date__isnull=True) | models.Q(end_date__gte=timezone.now())
            )
            .order_by("position", "-created_at")
            .first()
        )
    except Exception:
        logger.warning("Failed to load active banner", exc_info=True)
    
    # Calculate cart count
    cart_count = 0
    cart = None
    if request.user.is_authenticated:
        cart = Cart.objects.filter(user=request.user).first()
    elif request.session.session_key:
        cart = Cart.objects.filter(session_key=request.session.session_key).first()

    if cart:
        cart_count = sum(item.quantity for item in cart.items.all())

    site_settings = SiteSettings.get_solo()

    # Saved items count for the header heart (session or account backed)
    wishlist_count = 0
    try:
        from .views_wishlist import get_wishlist_ids
        wishlist_count = len(get_wishlist_ids(request))
    except Exception:
        logger.warning("Failed to load wishlist count", exc_info=True)

    return {
        "nav_categories": categories,
        "age_groups": AGE_GROUPS,
        "cart_count": cart_count,
        "cart": cart,
        "wishlist_count": wishlist_count,
        "site_settings": site_settings,
        "active_banner": active_banner,
        "whatsapp_phone": "+254726771321",
        "whatsapp_url": "https://wa.me/254726771321?text=Hello%20Malaika%20Nest%2C%20I%20have%20an%20inquiry",
    }
