from django.db.models import (
    Avg,
    Count,
    Exists,
    FloatField,
    IntegerField,
    OuterRef,
    Q,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.cache import cache
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings

try:
    from django_filters.rest_framework import DjangoFilterBackend
except ModuleNotFoundError:

    class DjangoFilterBackend(filters.BaseFilterBackend):
        def filter_queryset(self, request, queryset, view):
            return queryset


from .models import (
    Banner,
    Brand,
    Category,
    Inventory,
    Product,
    ProductVariant,
    Review,
    Wishlist,
)
from .serializers import (
    BannerSerializer,
    BrandSerializer,
    CategorySerializer,
    InventorySerializer,
    ProductListSerializer,
    ProductSerializer,
    ReviewSerializer,
    WishlistSerializer,
)


def resolve_category_by_path(value):
    if not value:
        return None

    normalized = str(value).strip("/")
    if not normalized:
        return None

    segments = [segment for segment in normalized.split("/") if segment]
    parent = None
    category = None
    for segment in segments:
        category = Category.objects.filter(parent=parent, slug=segment).first()
        if not category:
            return None
        parent = category
    return category


class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    search_fields = ["name", "description"]
    filterset_fields = ["is_active"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def list(self, request, *args, **kwargs):
        cache_key = "categories_list"
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=3600)  # Cache for 1 hour
        return response

    def get_queryset(self):
        queryset = Category.objects.select_related(
            "parent", "parent__parent"
        ).prefetch_related(
            "children",
            "children__children",
            "children__children__children",
        )

        if self.action != "list":
            return queryset

        if self.request.query_params.get("flat") in {"1", "true", "True"}:
            return queryset.order_by("name")

        parent_value = self.request.query_params.get("parent")
        if parent_value:
            if parent_value.isdigit():
                return queryset.filter(parent_id=parent_value).order_by("name")
            parent_category = resolve_category_by_path(parent_value)
            if parent_category:
                return queryset.filter(parent=parent_category).order_by("name")
            return queryset.none()

        path_value = self.request.query_params.get("path")
        if path_value:
            category = resolve_category_by_path(path_value)
            if category:
                return queryset.filter(pk=category.pk)
            return queryset.none()

        return queryset.filter(parent__isnull=True).order_by("name")

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def perform_update(self, serializer):
        super().perform_update(serializer)
        cache.delete("categories_list")

    def perform_create(self, serializer):
        super().perform_create(serializer)
        cache.delete("categories_list")

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        cache.delete("categories_list")

    @action(detail=False, methods=["get"])
    def resolve(self, request):
        value = request.query_params.get("path") or request.query_params.get("slug")
        category = resolve_category_by_path(value)
        if not category and value:
            category = Category.objects.filter(slug=value).first()
        if not category:
            return Response({"detail": "Category not found"}, status=404)
        return Response(self.get_serializer(category).data)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [
        filters.SearchFilter,
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "description", "sku", "brand__name", "category__name"]
    ordering_fields = [
        "price",
        "name",
        "created_at",
        "stock",
        "popularity",
        "avg_rating",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = (
            Product.objects.filter(is_active=True)
            .select_related(
                "category", "category__parent", "category__parent__parent", "brand"
            )
            .prefetch_related("category__children")
            .annotate(
                avg_rating=Coalesce(
                    Avg("reviews__rating"), Value(0.0), output_field=FloatField()
                ),
                review_count=Coalesce(
                    Count("reviews", distinct=True),
                    Value(0),
                    output_field=IntegerField(),
                ),
                popularity=Coalesce(
                    Sum("orderitem__quantity"), Value(0), output_field=IntegerField()
                ),
            )
        )

        category_value = self.request.query_params.get(
            "category"
        ) or self.request.query_params.get("category_path")
        if category_value:
            category = resolve_category_by_path(category_value)
            if not category:
                category = Category.objects.filter(slug=category_value).first()
            if category:
                queryset = queryset.filter(
                    category_id__in=category.descendant_ids(include_self=True)
                )
            else:
                queryset = queryset.none()

        brand_slug = self.request.query_params.get("brand")
        if brand_slug:
            queryset = queryset.filter(brand__slug=brand_slug)

        price_min = self.request.query_params.get("price_min")
        price_max = self.request.query_params.get("price_max")
        if price_min:
            queryset = queryset.filter(price__gte=price_min)
        if price_max:
            queryset = queryset.filter(price__lte=price_max)

        group = self.request.query_params.get("group")
        if group:
            queryset = queryset.filter(category__group__iexact=group)

        featured = self.request.query_params.get("featured")
        if featured:
            queryset = queryset.filter(featured=featured.lower() == "true")

        status_value = self.request.query_params.get("status")
        if status_value:
            queryset = queryset.filter(status=status_value)

        slug = self.request.query_params.get("slug")
        if slug:
            queryset = queryset.filter(slug=slug)

        gender = self.request.query_params.get("gender")
        if gender:
            queryset = queryset.filter(gender=gender)

        age_group = self.request.query_params.get("age_group")
        if age_group:
            queryset = queryset.filter(age_group=age_group)

        age_range = self.request.query_params.get("age_range")
        if age_range:
            queryset = queryset.filter(age_range=age_range)

        rating_min = self.request.query_params.get("rating_min")
        if rating_min:
            queryset = queryset.filter(avg_rating__gte=rating_min)

        availability = self.request.query_params.get("availability")
        if availability == "in_stock":
            queryset = queryset.filter(stock__gt=0)
        elif availability == "out_of_stock":
            queryset = queryset.filter(stock=0)

        size = self.request.query_params.get("size")
        color = self.request.query_params.get("color")
        if size or color:
            variant_qs = ProductVariant.objects.filter(
                product=OuterRef("pk"), is_active=True
            )
            if size:
                variant_qs = variant_qs.filter(size=size)
                queryset = queryset.filter(Q(size_label=size) | Exists(variant_qs))
            if color:
                variant_qs = variant_qs.filter(color=color)
                queryset = queryset.filter(Exists(variant_qs))
            queryset = queryset.distinct()

        return queryset

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductSerializer

    @action(detail=True, methods=["get"])
    def inventory(self, request, pk=None):
        product = get_object_or_404(Product, pk=pk)
        return Response(
            {
                "stock": product.stock,
                "available": product.available_stock,
                "low_stock": product.is_low_stock,
            }
        )

    @action(detail=True, methods=["get"])
    def variants(self, request, pk=None):
        product = get_object_or_404(Product, pk=pk)
        variants = product.variants.filter(is_active=True)

        sizes = {variant.size for variant in variants if variant.size}
        colors = {variant.color for variant in variants if variant.color}

        return Response(
            {
                "sizes": sorted(list(sizes)),
                "colors": sorted(list(colors)),
                "has_variants": bool(sizes or colors),
            }
        )


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.select_related("product").all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAdminUser]


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related("user", "product").order_by("-created_at")
    serializer_class = ReviewSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["product", "rating"]
    search_fields = ["title", "body"]
    ordering_fields = ["created_at", "rating"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action in ["create"]:
            return [permissions.IsAuthenticated()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get("product")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, user_email=self.request.user.email)


class WishlistViewSet(viewsets.ModelViewSet):
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all().order_by("position", "-created_at")
    serializer_class = BannerSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def list(self, request, *args, **kwargs):
        cache_key = "banners_list_active"
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=3600)  # Cache for 1 hour
        return response

    def get_queryset(self):
        queryset = Banner.objects.all().order_by("position", "-created_at")
        if self.action == "list":
            now = timezone.now()
            return queryset.filter(
                is_active=True,
                start_date__lte=now,
            ).filter(Q(end_date__gte=now) | Q(end_date__isnull=True))
        return queryset

    def perform_update(self, serializer):
        super().perform_update(serializer)
        cache.delete("banners_list_active")

    def perform_create(self, serializer):
        super().perform_create(serializer)
        cache.delete("banners_list_active")

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        cache.delete("banners_list_active")
