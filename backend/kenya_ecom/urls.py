from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
import os
from apps.core.healthcheck import health_check, readiness_check

admin.site.site_header = 'Kenya Baby E-Commerce Admin'

admin_secret = os.getenv('ADMIN_URL_SECRET', 'admin')

urlpatterns = [
    path('', include('apps.products.urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/ai/', include('apps.ai.urls')),
    path('api/health/', health_check, name='health_check'),
    path('api/ready/', readiness_check, name='readiness_check'),
    path(f'admin/{admin_secret}/', admin.site.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
