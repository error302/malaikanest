from django.urls import path
from .views import SiteSettingsView, PublicSettingsView

urlpatterns = [
    path('settings/', SiteSettingsView.as_view(), name='site-settings'),
    path('settings/public/', PublicSettingsView.as_view(), name='public-settings'),
]

