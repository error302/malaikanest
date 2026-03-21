from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.core.healthcheck import health_check, readiness_check

admin.site.site_header = 'Malaika Nest E-Commerce Admin'
admin.site.site_title = 'Malaika Nest Shop Admin'

admin_prefix = (getattr(settings, "ADMIN_URL_PREFIX", None) or "manage-store").strip("/")

urlpatterns = [
    # Versioned API
    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/products/', include('apps.products.urls')),
    path('api/v1/orders/', include('apps.orders.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/ai/', include('apps.ai.urls')),
    path('api/v1/core/', include('apps.core.urls')),

    # Compatibility aliases (legacy, non-versioned)
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/ai/', include('apps.ai.urls')),
    path('api/core/', include('apps.core.urls')),

    # Health
    path('api/health/', health_check, name='health_check'),
    path('api/ready/', readiness_check, name='readiness_check'),

    # Admin
    path(f'{admin_prefix}/', admin.site.urls),
]


# Always add media URL pattern — in production Nginx serves /media/ directly
# before requests reach Django, so this adds zero overhead in prod.
# In non-Nginx environments (staging, direct gunicorn) this ensures images load.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
