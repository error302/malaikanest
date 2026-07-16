from django.urls import path
from .views import (
    SiteSettingsView,
    PublicSettingsView,
    ContactFormView,
    Pm2LogsView,
    HealthCheckView,
    ShopPhotosView,
)

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("settings/", SiteSettingsView.as_view(), name="site-settings"),
    path("settings/public/", PublicSettingsView.as_view(), name="public-settings"),
    path("contact/", ContactFormView.as_view(), name="contact-form"),
    path("logs/", Pm2LogsView.as_view(), name="logs"),
    path("shop-photos/", ShopPhotosView.as_view(), name="shop-photos"),
]
