from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404, render
from django.views import View

from decimal import Decimal

from apps.orders.models import get_delivery_fee_for_region
from apps.products.models import Banner, Category, Product
from .sizing import filter_size, prepare_product, shopping_queryset
from .views_wishlist import get_wishlist_ids

FREE_SHIPPING_THRESHOLD = Decimal("10000.00")
PUBLIC_STATUS = "published"


class HomeView(View):
    def get(self, request):
        banner = Banner.objects.filter(is_active=True).order_by("position", "pk").first()
        categories = Category.objects.filter(parent__isnull=True).exclude(slug="shop-photo-review").order_by("name")
        products = shopping_queryset(
            Product.objects.filter(is_active=True, status=PUBLIC_STATUS)
            .prefetch_related("images").select_related("category")
            .order_by("-featured", "-created_at", "pk")
        )
        featured_products = [prepare_product(product) for product in products[:12]]

        from apps.core.models import SiteSettings
        from .context_processors import AGE_GROUPS

        context = {
            "active_banner": banner,
            "categories": categories,
            "featured_products": featured_products,
            "new_arrivals": products.order_by("-created_at", "pk")[:12],
            "age_groups": AGE_GROUPS,
            "free_shipping_threshold": SiteSettings.get_free_shipping_threshold(),
        }
        return render(request, "storefront/home.html", context)


class ProductListView(View):
    def get(self, request, category_slug=None):
        queryset = (
            Product.objects.filter(is_active=True, status=PUBLIC_STATUS)
            .prefetch_related("images")
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
            queryset = filter_size(queryset, age_param)

        condition_param = request.GET.get("condition")
        if condition_param in ("new", "mtumba"):
            queryset = queryset.filter(condition=condition_param)

        query = request.GET.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(category__name__icontains=query)
            )

        sort = request.GET.get("sort", "-created_at")
        size_param = request.GET.get('size', '').strip()
        if size_param:
            queryset = filter_size(queryset, size_param)
        queryset = shopping_queryset(queryset)
        if sort == "price_asc":
            queryset = queryset.order_by("price")
        elif sort == "price_desc":
            queryset = queryset.order_by("-price")
        elif sort == "name":
            queryset = queryset.order_by("name")
        else:
            queryset = queryset.order_by("-created_at")

        paginator = Paginator(queryset, 16)
        page_number = request.GET.get("page", 1)
        page_obj = paginator.get_page(page_number)
        for product in page_obj:
            prepare_product(product)
        pagination_params = request.GET.copy()
        pagination_params.pop('page', None)

        categories = Category.objects.filter(parent__isnull=True).exclude(slug="shop-photo-review").order_by("name")

        context = {
            "products": page_obj,
            "wishlist_ids": get_wishlist_ids(request),
            "selected_category": selected_category,
            "categories": categories,
            "search_query": query,
            "selected_age": age_param,
            "selected_sort": sort,
            "selected_condition": condition_param,
            "total_count": paginator.count,
            "selected_size": size_param,
            "size_choices": Product.SIZE_CHOICES,
            "pagination_query": pagination_params.urlencode(),
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
