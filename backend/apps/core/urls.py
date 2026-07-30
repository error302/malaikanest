from django.urls import path
from .views import (
    SiteSettingsView,
    PublicSettingsView,
    ContactFormView,
    Pm2LogsView,
    HealthCheckView,
    ShopPhotosView,
)
from .data_export import (
    request_data_export,
    list_data_exports,
    data_export_status,
    download_data_export,
)

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("settings/", SiteSettingsView.as_view(), name="site-settings"),
    path("settings/public/", PublicSettingsView.as_view(), name="public-settings"),
    path("contact/", ContactFormView.as_view(), name="contact-form"),
    path("logs/", Pm2LogsView.as_view(), name="logs"),
    path("shop-photos/", ShopPhotosView.as_view(), name="shop-photos"),
    # GDPR data export
    path("data-exports/request/", request_data_export, name="data-export-request"),
    path("data-exports/", list_data_exports, name="data-export-list"),
    path("data-exports/<uuid:export_id>/", data_export_status, name="data-export-status"),
    path("data-exports/<uuid:export_id>/download/", download_data_export, name="data-export-download"),
]
