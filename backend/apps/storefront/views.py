from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404, render
from django.views import View

from decimal import Decimal

from apps.orders.models import get_delivery_fee_for_region
from apps.products.models import Banner, Category, Product

FREE_SHIPPING_THRESHOLD = Decimal("2000.00")


class HomeView(View):
    def get(self, request):
        banners = Banner.objects.filter(is_active=True).order_by("position")[:5]
        categories = Category.objects.filter(parent__isnull=True).order_by("name")
        featured_products = (
            Product.objects.filter(is_active=True, featured=True)
            .prefetch_related("images")
            .select_related("category")[:8]
        )
        if not featured_products.exists():
            featured_products = (
                Product.objects.filter(is_active=True)
                .prefetch_related("images")
                .select_related("category")[:8]
            )

        new_arrivals = (
            Product.objects.filter(is_active=True)
            .prefetch_related("images")
            .select_related("category")
            .order_by("-created_at")[:8]
        )

        age_groups = [
            {"label": "Newborn", "slug": "newborn", "image": "/images/ages/newborn.jpg"},
            {"label": "0-3 Months", "slug": "0-3m", "image": "/images/ages/0-3m.jpg"},
            {"label": "3-6 Months", "slug": "3-6m", "image": "/images/ages/3-6m.jpg"},
            {"label": "6-12 Months", "slug": "6-12m", "image": "/images/ages/6-9m.jpg"},
            {"label": "1-2 Years", "slug": "1-2y", "image": "/images/ages/1-2y.jpg"},
            {"label": "2-4 Years", "slug": "2-4y", "image": "/images/ages/2-4y.jpg"},
            {"label": "4-6 Years", "slug": "4-6y", "image": "/images/ages/4-6y.jpg"},
        ]

        context = {
            "banners": banners,
            "categories": categories,
            "featured_products": featured_products,
            "new_arrivals": new_arrivals,
            "age_groups": age_groups,
        }
        return render(request, "storefront/home.html", context)


class ProductListView(View):
    def get(self, request, category_slug=None):
        queryset = (
            Product.objects.filter(is_active=True)
            .prefetch_related("images")
            .select_related("category")
        )

        cat_param = category_slug or request.GET.get("category")
        selected_category = None
        if cat_param:
            selected_category = Category.objects.filter(slug=cat_param).first()
            if selected_category:
                # Include subcategories
                descendant_ids = selected_category.descendant_ids(include_self=True)
                queryset = queryset.filter(category_id__in=descendant_ids)

        age_param = request.GET.get("age")
        if age_param:
            queryset = queryset.filter(
                Q(age_group=age_param) | Q(age_range__icontains=age_param) | Q(size_label=age_param)
            )

        query = request.GET.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(category__name__icontains=query)
            )

        sort = request.GET.get("sort", "-created_at")
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

        categories = Category.objects.filter(parent__isnull=True).order_by("name")

        context = {
            "products": page_obj,
            "selected_category": selected_category,
            "categories": categories,
            "search_query": query,
            "selected_age": age_param,
            "selected_sort": sort,
            "total_count": paginator.count,
        }
        return render(request, "storefront/product_list.html", context)


class ProductDetailView(View):
    def get(self, request, slug):
        product = get_object_or_404(
            Product.objects.prefetch_related("variants", "images").select_related("category"),
            slug=slug,
            is_active=True,
        )

        variants = product.variants.all()
        related_products = (
            Product.objects.filter(category=product.category, is_active=True)
            .exclude(pk=product.pk)
            .prefetch_related("images")[:4]
        )

        context = {
            "product": product,
            "variants": variants,
            "related_products": related_products,
            "mombasa_fee": get_delivery_fee_for_region("mombasa"),
            "nairobi_fee": get_delivery_fee_for_region("nairobi"),
            "upcountry_fee": get_delivery_fee_for_region("upcountry"),
            "free_shipping_threshold": FREE_SHIPPING_THRESHOLD,
        }
        return render(request, "storefront/product_detail.html", context)


class StaticPageView(View):
    """Renders simple static storefront pages (delivery, contact)."""

    template_name = None

    def get(self, request):
        from apps.orders.models import get_delivery_fee_for_region

        context = {
            "mombasa_fee": get_delivery_fee_for_region("mombasa"),
            "nairobi_fee": get_delivery_fee_for_region("nairobi"),
            "upcountry_fee": get_delivery_fee_for_region("upcountry"),
            "free_shipping_threshold": FREE_SHIPPING_THRESHOLD,
        }
        return render(request, self.template_name, context)
