from django.urls import path
from . import views, views_cart, views_checkout

app_name = "storefront"

urlpatterns = [
    # Catalogue
    path("", views.HomeView.as_view(), name="home"),
    path("products/", views.ProductListView.as_view(), name="product_list"),
    path("products/<slug:slug>/", views.ProductDetailView.as_view(), name="product_detail"),
    path("categories/", views.ProductListView.as_view(), name="category_list"),
    path("categories/<slug:category_slug>/", views.ProductListView.as_view(), name="category_detail"),

    # Cart
    path("cart/", views_cart.CartView.as_view(), name="cart"),
    path("cart/add/", views_cart.AddToCartView.as_view(), name="cart_add"),
    path("cart/update/", views_cart.UpdateCartItemView.as_view(), name="cart_update"),
    path("cart/remove/", views_cart.RemoveCartItemView.as_view(), name="cart_remove"),
    path("cart/coupon/apply/", views_cart.ApplyCouponView.as_view(), name="cart_apply_coupon"),
    path("cart/coupon/remove/", views_cart.RemoveCouponView.as_view(), name="cart_remove_coupon"),
    path("cart/region/", views_cart.UpdateDeliveryRegionView.as_view(), name="cart_region"),

    # Checkout & Payment
    path("checkout/", views_checkout.CheckoutView.as_view(), name="checkout"),
    path("checkout/paypal/return/", views_checkout.PayPalReturnView.as_view(), name="paypal_return"),
    path("orders/<str:receipt_number>/", views_checkout.OrderStatusView.as_view(), name="order_status"),
    path("orders/<str:receipt_number>/status/", views_checkout.OrderStatusPollView.as_view(), name="order_status_poll"),

    # Static pages
    path("delivery-returns/", views.StaticPageView.as_view(template_name="storefront/delivery_returns.html"), name="delivery_returns"),
    path("contact/", views.StaticPageView.as_view(template_name="storefront/contact.html"), name="contact"),
]
