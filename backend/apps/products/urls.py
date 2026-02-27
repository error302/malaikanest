from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BrandViewSet,
    CategoryViewSet,
    ProductViewSet,
    InventoryViewSet,
    ReviewViewSet,
    WishlistViewSet,
    BannerViewSet,
)
from .admin_views import (
    AdminProductViewSet,
    AdminCategoryViewSet,
    AdminBannerViewSet,
    AdminUserViewSet,
    AdminOrderViewSet,
)

router = DefaultRouter()
router.register("brands", BrandViewSet)
router.register("categories", CategoryViewSet)
router.register("products", ProductViewSet)
router.register("inventory", InventoryViewSet)
router.register("reviews", ReviewViewSet)
router.register("wishlist", WishlistViewSet, basename="wishlist")
router.register("banners", BannerViewSet, basename="banner")

# Admin endpoints
router.register("admin/products", AdminProductViewSet, basename="admin-products")
router.register("admin/categories", AdminCategoryViewSet, basename="admin-categories")
router.register("admin/banners", AdminBannerViewSet, basename="admin-banners")
router.register("admin/users", AdminUserViewSet, basename="admin-users")
router.register("admin/orders", AdminOrderViewSet, basename="admin-orders")

urlpatterns = [
    path("", include(router.urls)),
]
