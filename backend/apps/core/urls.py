from django.urls import path
from .views import SiteSettingsView, PublicSettingsView, ContactFormView

urlpatterns = [
    path('settings/', SiteSettingsView.as_view(), name='site-settings'),
    path('settings/public/', PublicSettingsView.as_view(), name='public-settings'),
    path('contact/', ContactFormView.as_view(), name='contact-form'),
]

