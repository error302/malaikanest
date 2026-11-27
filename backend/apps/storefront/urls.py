from django.urls import path
from django.views.generic import RedirectView

from . import views, views_cart, views_checkout, pwa, views_wishlist
from . import seo
from .admin_spa import AdminDashboardView
from apps.accounts import storefront_auth

app_name = "storefront"

urlpatterns = [
    path("manifest.webmanifest", pwa.manifest, name="manifest"),
    path("sw.js", pwa.service_worker, name="service_worker"),
    # SEO
    path("robots.txt", seo.robots_txt, name="robots"),
    path("sitemap.xml", seo.sitemap_xml, name="sitemap"),
    # Legacy URLs from the previous Next.js deployment — 301 them so Google
    # (which still crawls them) and old links land on the live page.
    path("find-us/", RedirectView.as_view(url="/contact/", permanent=True), name="legacy-find-us"),
    path("about/", RedirectView.as_view(url="/contact/", permanent=True), name="legacy-about"),
    path("faq/", RedirectView.as_view(url="/delivery-returns/", permanent=True), name="legacy-faq"),
    path("shipping/", RedirectView.as_view(url="/delivery-returns/", permanent=True), name="legacy-shipping"),
    path("returns/", RedirectView.as_view(url="/delivery-returns/", permanent=True), name="legacy-returns"),
    path("shop/", RedirectView.as_view(url="/products/", permanent=True), name="legacy-shop"),
    path("best-sellers/", RedirectView.as_view(url="/products/", permanent=True), name="legacy-best-sellers"),
    path("login/", RedirectView.as_view(url="/account/signin/", permanent=True), name="legacy-login"),
    path("register/", RedirectView.as_view(url="/account/signup/", permanent=True), name="legacy-register"),
    path("wishlist/", RedirectView.as_view(url="/saved/", permanent=True), name="legacy-wishlist"),
    # Catalogue
    path("", views.HomeView.as_view(), name="home"),
    path("products/", views.ProductListView.as_view(), name="product_list"),
    path("products/<slug:slug>/", views.ProductDetailView.as_view(), name="product_detail"),
    path("categories/", views.ProductListView.as_view(), name="category_list"),
    path("categories/<path:category_slug>/", views.ProductListView.as_view(), name="category_detail"),

    # Cart
    path("cart/", views_cart.CartView.as_view(), name="cart"),
    path("cart/add/", views_cart.AddToCartView.as_view(), name="cart_add"),
    path("cart/update/", views_cart.UpdateCartItemView.as_view(), name="cart_update"),
    path("cart/remove/", views_cart.RemoveCartItemView.as_view(), name="cart_remove"),
    path("cart/coupon/apply/", views_cart.ApplyCouponView.as_view(), name="cart_apply_coupon"),
    path("cart/coupon/remove/", views_cart.RemoveCouponView.as_view(), name="cart_remove_coupon"),
    path("cart/region/", views_cart.UpdateDeliveryRegionView.as_view(), name="cart_region"),

    # Wishlist (saved items)
    path("saved/", views_wishlist.WishlistView.as_view(), name="wishlist"),
    path("saved/toggle/<slug:slug>/", views_wishlist.WishlistToggleView.as_view(), name="wishlist_toggle"),

    # Customer account (session-based, server-rendered)
    path("account/", storefront_auth.AccountHomeView.as_view(), name="account"),
    path("account/signin/", storefront_auth.SignInView.as_view(), name="signin"),
    path("account/signup/", storefront_auth.SignUpView.as_view(), name="signup"),
    path("account/signout/", storefront_auth.SignOutView.as_view(), name="signout"),
    # Customer self-service password reset + email verification
    path("account/forgot/", storefront_auth.ForgotPasswordView.as_view(), name="forgot_password"),
    path("account/reset/", storefront_auth.ResetPasswordView.as_view(), name="reset_password"),
    path("verify-email/", storefront_auth.VerifyEmailView.as_view(), name="verify_email"),

    # Checkout & Payment
    path("checkout/", views_checkout.CheckoutView.as_view(), name="checkout"),
    path("checkout/paypal/return/", views_checkout.PayPalReturnView.as_view(), name="paypal_return"),
    path("track/", views_checkout.OrderLookupView.as_view(), name="order_lookup"),
    path("orders/<str:receipt_number>/", views_checkout.OrderStatusView.as_view(), name="order_status"),
    path("orders/<str:receipt_number>/status/", views_checkout.OrderStatusPollView.as_view(), name="order_status_poll"),

    # Static pages
    path("delivery-returns/", views.StaticPageView.as_view(template_name="storefront/delivery_returns.html"), name="delivery_returns"),
    path("privacy-policy/", views.StaticPageView.as_view(template_name="storefront/privacy_policy.html"), name="privacy_policy"),
    path("terms-of-service/", views.StaticPageView.as_view(template_name="storefront/terms_of_service.html"), name="terms_of_service"),
    path("contact/", views.StaticPageView.as_view(template_name="storefront/contact.html"), name="contact"),

    # Static TS admin dashboard (serves backend/static/adminapp/index.html)
    path("manage/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
]
