from django.contrib import admin
from .models import DeliveryZone, Order, OrderItem, Cart, CartItem, Coupon, Invoice


@admin.register(DeliveryZone)
class DeliveryZoneAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "fee", "estimated_days", "is_active", "position")
    list_filter = ("is_active",)
    list_editable = ("fee", "is_active", "position")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("position", "name")
