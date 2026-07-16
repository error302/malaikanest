from django.contrib import admin
from .models import SiteSettings, ShopPhoto


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("site_name", "contact_email", "contact_phone", "shipping_fee", "free_shipping_threshold")
    fieldsets = (
        ("General", {"fields": ("site_name", "site_description", "logo")}),
        ("Contact", {"fields": ("contact_email", "contact_phone", "address")}),
        ("Social", {"fields": ("facebook_url", "instagram_url", "twitter_url")}),
        ("Pricing", {"fields": ("shipping_fee", "free_shipping_threshold", "minimum_order_amount")}),
    )

    def has_add_permission(self, request):
        return False if SiteSettings.objects.exists() else True

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ShopPhoto)
class ShopPhotoAdmin(admin.ModelAdmin):
    list_display = ("caption", "is_active", "position", "created_at")
    list_filter = ("is_active",)
    list_editable = ("is_active", "position")
    search_fields = ("caption",)
    ordering = ("position", "-created_at")
