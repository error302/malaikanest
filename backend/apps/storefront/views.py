import re
from difflib import SequenceMatcher
from functools import reduce
from operator import and_, or_

from django.core.paginator import Paginator
from django.db.models import Case, IntegerField, Q, Value, When
from django.shortcuts import get_object_or_404, render
from django.views import View

from decimal import Decimal

from apps.orders.models import get_delivery_fee_for_region
from apps.products.models import Banner, Category, Product
from .sizing import filter_size, prepare_product, shopping_queryset
from .views_wishlist import get_wishlist_ids

FREE_SHIPPING_THRESHOLD = Decimal("10000.00")
PUBLIC_STATUS = "published"


def _query_tokens(query):
    return [t for t in re.findall(r"[a-z0-9]+", query.lower()) if len(t) > 1]


def search_products(queryset, all_products, query):
    """Rank direct matches; if there are none, return close alternatives.

    Returns (matched_queryset, exact_hits, suggestions). The template shows a
    clear "no items match" message plus the suggestions instead of a dead end.
    """
    tokens = _query_tokens(query)
    if not tokens:
        return queryset, True, []

    name_any = reduce(or_, (Q(name__icontains=t) for t in tokens))
    name_all = reduce(and_, (Q(name__icontains=t) for t in tokens))
    text_any = reduce(
        or_,
        (Q(name__icontains=t) | Q(description__icontains=t)
         | Q(category__name__icontains=t) | Q(category__slug__icontains=t)
         for t in tokens),
    )
    rank = Case(
        When(name__iexact=query, then=Value(5)),
        When(name_all, then=Value(4)),
        When(name__icontains=query, then=Value(3)),
        When(name_any, then=Value(2)),
        default=Value(1),
        output_field=IntegerField(),
    )
    matches = queryset.filter(text_any).annotate(_search_rank=rank)
    if matches.exists():
        return matches, True, []

    # No direct hit: score a bounded slice of the full catalogue by name
    # similarity + shared tokens, so the customer still gets useful results.
    needle = query.lower()
    scored = []
    for product in all_products.select_related('category').only(
        'id', 'name', 'slug', 'category__name'
    )[:400]:
        label = f"{product.name} {product.category.name if product.category_id else ''}".lower()
        score = SequenceMatcher(None, needle, label).ratio()
        score += 0.12 * sum(1 for t in tokens if t in label)
        if score >= 0.28:
            scored.append((score, product))
    scored.sort(key=lambda item: (-item[0], item[1].name))
    return queryset.none(), False, [product for _, product in scored[:8]]


class HomeView(View):
    def get(self, request):
        banner = Banner.objects.filter(is_active=True).order_by("position", "pk").first()
        categories = Category.objects.filter(parent__isnull=True).exclude(slug="shop-photo-review").order_by("name")
        products = shopping_queryset(
            Product.objects.filter(is_active=True, status=PUBLIC_STATUS)
            .prefetch_related("images").select_related("category")
            .order_by("-featured", "-created_at", "pk")
        )
        featured_products = [prepare_product(product) for product in products[:8]]

        from apps.core.models import SiteSettings
        from .context_processors import AGE_GROUPS

        # One scrollable row per top-level category that has products.
        # Subcategory products roll up into their root row.
        root_of = {
            cat.id: cat.parent_id
            for cat in Category.objects.filter(parent__isnull=False).only("id", "parent_id")
        }
        products_by_root = {}
        for product in products[:120]:
            root_id = root_of.get(product.category_id, product.category_id)
            products_by_root.setdefault(root_id, []).append(product)

        category_rows = []
        for cat in categories:
            items = products_by_root.get(cat.id, [])[:6]
            if items:
                category_rows.append(
                    {"category": cat, "products": [prepare_product(p) for p in items]}
                )

        context = {
            "active_banner": banner,
            "categories": categories,
            "featured_products": featured_products,
            "category_rows": category_rows,
            "new_arrivals": products.order_by("-created_at", "pk")[:12],
            "age_groups": AGE_GROUPS,
            "free_shipping_threshold": SiteSettings.get_free_shipping_threshold(),
        }
        return render(request, "storefront/home.html", context)


class ProductListView(View):
    def get(self, request, category_slug=None):
        all_products = Product.objects.filter(is_active=True, status=PUBLIC_STATUS)
        queryset = (
            all_products.prefetch_related("images")
            .select_related("category")
        )

        cat_param = category_slug or request.GET.get("category")
        selected_category = None
        if cat_param:
            selected_category = Category.resolve_by_path(cat_param)
            if selected_category:
                # Include subcategories
                descendant_ids = selected_category.descendant_ids(include_self=True)
                queryset = queryset.filter(category_id__in=descendant_ids)

        age_param = request.GET.get("age")
        if age_param:
            queryset = filter_size(queryset, age_param, match_age_range=True)

        condition_param = request.GET.get("condition")
        if condition_param in ("new", "mtumba"):
            queryset = queryset.filter(condition=condition_param)

        query = request.GET.get("q", "").strip()
        search_suggestions = []
        exact_search_hits = True
        if query:
            queryset, exact_search_hits, suggestions = search_products(
                queryset, all_products, query
            )
            search_suggestions = [prepare_product(p) for p in suggestions]

        sort = request.GET.get("sort", "-created_at")
        size_param = request.GET.get('size', '').strip()
        if size_param:
            queryset = filter_size(queryset, size_param)
        queryset = shopping_queryset(queryset)
        if sort == "price_asc":
            ordering = ["price"]
        elif sort == "price_desc":
            ordering = ["-price"]
        elif sort == "name":
            ordering = ["name"]
        else:
            ordering = ["-created_at"]
        if query and exact_search_hits:
            ordering.insert(0, "-_search_rank")
        queryset = queryset.order_by(*ordering)

        paginator = Paginator(queryset, 16)
        page_number = request.GET.get("page", 1)
        page_obj = paginator.get_page(page_number)
        for product in page_obj:
            prepare_product(product)
        pagination_params = request.GET.copy()
        pagination_params.pop('page', None)
        sort_params = pagination_params.copy()
        sort_params.pop('sort', None)

        categories = Category.objects.filter(parent__isnull=True).exclude(slug="shop-photo-review").order_by("name")

        context = {
            "products": page_obj,
            "wishlist_ids": get_wishlist_ids(request),
            "selected_category": selected_category,
            "categories": categories,
            "search_query": query,
            "no_search_matches": bool(query) and not exact_search_hits,
            "search_suggestions": search_suggestions,
            "selected_age": age_param,
            "selected_sort": sort,
            "selected_condition": condition_param,
            "total_count": paginator.count,
            "selected_size": size_param,
            "size_choices": Product.SIZE_CHOICES,
            "pagination_query": pagination_params.urlencode(),
            "sort_query": sort_params.urlencode(),
        }
        return render(request, "storefront/product_list.html", context)


class ProductDetailView(View):
    def get(self, request, slug):
        product = get_object_or_404(
            shopping_queryset(Product.objects.prefetch_related("images").select_related("category")),
            slug=slug,
            is_active=True,
            status=PUBLIC_STATUS,
        )

        prepare_product(product)
        variants = product.shop_variants
        available_variants = [variant for variant in variants if variant.shop_stock > 0]

        # Related products in same category
        related_products = (
            shopping_queryset(
                Product.objects.filter(
                    category=product.category,
                    is_active=True,
                    status=PUBLIC_STATUS,
                ).exclude(pk=product.pk)
            )[:4]
        )
        for rel in related_products:
            prepare_product(rel)

        from apps.core.models import SiteSettings
        free_shipping_threshold = SiteSettings.get_free_shipping_threshold()

        context = {
            "product": product,
            "variants": variants,
            "default_variant": available_variants[0] if len(available_variants) == 1 else None,
            "wishlist_ids": get_wishlist_ids(request),
            "related_products": related_products,
            "mombasa_fee": get_delivery_fee_for_region("mombasa"),
            "nairobi_fee": get_delivery_fee_for_region("nairobi"),
            "upcountry_fee": get_delivery_fee_for_region("upcountry"),
            "free_shipping_threshold": free_shipping_threshold,
        }
        return render(request, "storefront/product_detail.html", context)


class StaticPageView(View):
    """Renders simple static storefront pages (delivery, contact)."""

    template_name = None

    def get(self, request):
        from apps.core.models import SiteSettings
        from apps.orders.models import get_delivery_fee_for_region

        context = {
            "mombasa_fee": get_delivery_fee_for_region("mombasa"),
            "nairobi_fee": get_delivery_fee_for_region("nairobi"),
            "upcountry_fee": get_delivery_fee_for_region("upcountry"),
            "free_shipping_threshold": SiteSettings.get_free_shipping_threshold(),
        }
        return render(request, self.template_name, context)
