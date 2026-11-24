"""Session-backed wishlist for the storefront.

Mirrors the cart architecture: guests get a wishlist keyed to their session, and
it merges into the signed-in user's saved list on login. No account required to
save an item, which matters for a shop where most first visits are anonymous.
"""

import logging

from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views import View

from apps.products.models import Product, Wishlist

from .sizing import prepare_product, shopping_queryset

logger = logging.getLogger(__name__)

PUBLIC_STATUS = "published"
SESSION_KEY = "wishlist_product_ids"
MAX_ITEMS = 100


def _session_ids(request):
    """Saved product ids as strings (product PKs are UUIDs)."""
    ids = request.session.get(SESSION_KEY, [])
    if not isinstance(ids, list):
        return []
    return [str(i) for i in ids if i]


def _save_session_ids(request, ids):
    request.session[SESSION_KEY] = [str(i) for i in ids][:MAX_ITEMS]
    request.session.modified = True


def get_wishlist_ids(request):
    """Product ids the current visitor has saved (session or account)."""
    if request.user.is_authenticated:
        return [
            str(pk)
            for pk in Wishlist.objects.filter(user=request.user).values_list(
                "product_id", flat=True
            )
        ]
    return _session_ids(request)


def merge_session_wishlist(request, user=None):
    """Fold a guest wishlist into the account after login."""
    user = user or getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return
    ids = _session_ids(request)
    if not ids:
        return
    for product_id in ids:
        Wishlist.objects.get_or_create(user=user, product_id=product_id)
    request.session.pop(SESSION_KEY, None)
    request.session.modified = True


class WishlistToggleView(View):
    """Add or remove a product. Returns JSON for fetch, redirects otherwise."""

    def post(self, request, slug):
        product = get_object_or_404(
            Product, slug=slug, is_active=True, status=PUBLIC_STATUS
        )

        if request.user.is_authenticated:
            entry = Wishlist.objects.filter(user=request.user, product=product).first()
            if entry:
                entry.delete()
                saved = False
            else:
                Wishlist.objects.get_or_create(user=request.user, product=product)
                saved = True
        else:
            ids = _session_ids(request)
            product_id = str(product.pk)
            if product_id in ids:
                ids.remove(product_id)
                saved = False
            else:
                if len(ids) >= MAX_ITEMS:
                    return JsonResponse(
                        {"ok": False, "error": "Your saved list is full."}, status=400
                    )
                ids.append(product_id)
                saved = True
            _save_session_ids(request, ids)

        if request.headers.get("x-requested-with") == "fetch":
            return JsonResponse(
                {
                    "ok": True,
                    "saved": saved,
                    "count": len(get_wishlist_ids(request)),
                    "message": "Saved to your list" if saved else "Removed from your list",
                }
            )

        return redirect(request.META.get("HTTP_REFERER") or "storefront:product_list")


class WishlistView(View):
    """The saved-items page."""

    def get(self, request):
        ids = get_wishlist_ids(request)
        products = []
        if ids:
            queryset = shopping_queryset(
                Product.objects.filter(
                    pk__in=ids, is_active=True, status=PUBLIC_STATUS
                ).prefetch_related("images").select_related("category")
            )
            by_id = {str(p.pk): p for p in queryset}
            # Preserve the order the shopper saved them in.
            products = [by_id[i] for i in ids if i in by_id]
            for product in products:
                prepare_product(product)

        return render(
            request,
            "storefront/wishlist.html",
            {"products": products, "wishlist_ids": ids},
        )
