from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

try:
    from django_filters.rest_framework import DjangoFilterBackend
except ModuleNotFoundError:

    class DjangoFilterBackend(filters.BaseFilterBackend):
        def filter_queryset(self, request, queryset, view):
            return queryset


from .models import Category, Product, Inventory, Review, Wishlist, Brand
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductListSerializer,
    InventorySerializer,
    ReviewSerializer,
    WishlistSerializer,
    BannerSerializer,
    BrandSerializer,
)
from .models import Banner


class IsAdminUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    search_fields = ["name", "description"]
    filterset_fields = ["is_active"]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserOrReadOnly]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = (
        Product.objects.filter(is_active=True, stock__gt=0)
        .select_related("category", "brand")
        .prefetch_related("category__children")
    )
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    filter_backends = [
        filters.SearchFilter,
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "description", "sku"]
    filterset_fields = {
        "category__slug": ["exact"],
        "brand__slug": ["exact"],
        "price": ["gte", "lte"],
        "status": ["exact"],
        "featured": ["exact"],
        "gender": ["exact"],
    }
    ordering_fields = ["price", "name", "created_at", "stock"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

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
            queryset = queryset.filter(category__group=group)

        featured = self.request.query_params.get("featured")
        if featured:
            queryset = queryset.filter(featured=featured.lower() == "true")

        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        return queryset

    @action(detail=True, methods=["get"])
    def inventory(self, request, pk=None):
        product = get_object_or_404(Product, pk=pk)
        return Response(
            {
                "stock": product.stock,
                "available": product.stock,
                "low_stock": product.is_low_stock,
            }
        )


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.select_related("product").all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAdminUser]


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class WishlistViewSet(viewsets.ModelViewSet):
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Banner.objects.filter(is_active=True)
