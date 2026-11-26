
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import path, include, reverse_lazy, re_path
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from apps.accounts.staff_access import StorePasswordResetConfirmView, StorePasswordResetView
from apps.core.healthcheck import health_check, readiness_check
from apps.storefront.admin_spa import AdminDashboardView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

admin.site.site_header = 'Malaika Nest E-Commerce Admin'
admin.site.site_title = 'Malaika Nest Shop Admin'

admin_prefix = (getattr(settings, "ADMIN_URL_PREFIX", None) or "manage-store").strip("/")

urlpatterns = [
    # Versioned API
    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/products/', include('apps.products.urls')),
    path('api/v1/orders/', include('apps.orders.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/core/', include('apps.core.urls')),

    # Compatibility aliases (legacy, non-versioned)
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/core/', include('apps.core.urls')),

    # Health
    path('api/health/', health_check, name='health_check'),
    path('api/ready/', readiness_check, name='readiness_check'),

    # OpenAPI schema (Phase 5)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Prometheus metrics (Phase 5)
    path('metrics/', include('apps.core.metrics_urls')),

    # Static TS admin dashboard — mounted both at its own path and inside the
    # admin prefix (before the catch-all) so classic-admin logins that are
    # redirected with ?next= land on a real route.
    path(f'{admin_prefix}/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard-prefixed'),
    path('manage/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),

    # Staff-only account setup and recovery.
    path(f'{admin_prefix}/password-reset/', StorePasswordResetView.as_view(), name='password_reset'),
    path(f'{admin_prefix}/password-reset/sent/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path(f'{admin_prefix}/password-reset/<uidb64>/<token>/', StorePasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path(f'{admin_prefix}/password-ready/', auth_views.PasswordResetCompleteView.as_view(
        extra_context={"login_url": reverse_lazy("admin-dashboard")},
    ), name='password_reset_complete'),

    # ONE visible dashboard. The classic admin root redirects to the SPA;
    # its /login/, /password-reset/... and model URLs stay reachable as the
    # staff auth provider and emergency fallback (do not prefix-redirect them).
    re_path(rf'^{admin_prefix}/$', RedirectView.as_view(url='/manage/dashboard/', permanent=False),
            name='classic-admin-root'),

    # Admin
    path(f'{admin_prefix}/', admin.site.urls),

    # Storefront (Server-rendered Django Monolith)
    path('', include('apps.storefront.urls', namespace='storefront')),
]


# Always add media URL pattern — in production Nginx serves /media/ directly
# before requests reach Django, so this adds zero overhead in prod.
# In non-Nginx environments (staging, direct gunicorn) this ensures images load.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


# Django Debug Toolbar (dev only).
if settings.DEBUG and "debug_toolbar" in settings.INSTALLED_APPS:
    urlpatterns += [path("__debug__/", include("debug_toolbar.urls"))]
