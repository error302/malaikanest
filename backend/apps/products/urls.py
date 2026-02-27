from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, InventoryViewSet, ReviewViewSet, WishlistViewSet, BannerViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('products', ProductViewSet)
router.register('inventory', InventoryViewSet)
router.register('reviews', ReviewViewSet)
router.register('wishlist', WishlistViewSet, basename='wishlist')
router.register('banners', BannerViewSet, basename='banner')

urlpatterns = [
    path('', include(router.urls)),
]
