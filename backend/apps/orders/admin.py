from django.contrib import admin
from django.utils.html import format_html
from .models import DeliveryZone, Order, OrderItem, Cart, CartItem, Coupon, Invoice


@admin.register(DeliveryZone)
class DeliveryZoneAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "fee", "estimated_days", "is_active", "position")
    list_filter = ("is_active",)
    list_editable = ("fee", "is_active", "position")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("position", "name")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("receipt_number", "user", "status", "total", "created_at")
    list_filter = ("status", "payment_method", "created_at")
    search_fields = ("receipt_number", "user__email", "shipping_phone")
    readonly_fields = ("receipt_number", "created_at", "updated_at", "total", "checkout_token")
    ordering = ("-created_at",)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "variant_reference", "variant_details", "price", "quantity")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order_link", "product_name", "quantity", "unit_price")
    list_filter = ("order__status",)
    search_fields = ("product__name", "order__receipt_number")
    readonly_fields = ("product", "variant_reference", "variant_details", "price", "quantity")
    inlines = []

    @admin.display(description="Order", ordering="order__receipt_number")
    def order_link(self, obj):
        from django.urls import reverse
        url = reverse("admin:orders_order_change", args=[obj.order.id])
        return format_html('<a href="{}">{}</a>', url, obj.order.receipt_number)

    @admin.display(description="Product")
    def product_name(self, obj):
        return obj.product.name


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "item_count", "subtotal", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email",)
    readonly_fields = ("user", "session_key", "coupon", "delivery_region", "created_at", "updated_at")
    ordering = ("-created_at",)

    @admin.display(description="Items")
    def item_count(self, obj):
        return obj.items.count()

    @admin.display(description="Subtotal")
    def subtotal(self, obj):
        return str(obj.subtotal_amount())


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ("product", "variant", "quantity", "unit_price")


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart_link", "product_name", "quantity")
    search_fields = ("cart__user__email",)
    readonly_fields = ("cart", "product", "variant", "quantity", "unit_price")

    @admin.display(description="Cart")
    def cart_link(self, obj):
        from django.urls import reverse
        url = reverse("admin:orders_cart_change", args=[obj.cart.id])
        return format_html('<a href="{}">Cart {}</a>', url, obj.cart.id)

    @admin.display(description="Product")
    def product_name(self, obj):
        return obj.product.name


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "discount_type", "discount_value", "is_active", "used_count", "valid_from", "valid_to")
    list_filter = ("is_active", "discount_type")
    search_fields = ("code",)
    readonly_fields = ("used_count",)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("id", "order_link", "invoice_number", "created_at")
    search_fields = ("invoice_number", "order__receipt_number")
    readonly_fields = ("order", "invoice_number", "pdf_file", "pdf_url", "created_at", "sent_at", "download_count")

    @admin.display(description="Order")
    def order_link(self, obj):
        from django.urls import reverse
        url = reverse("admin:orders_order_change", args=[obj.order.id])
        return format_html('<a href="{}">{}</a>', url, obj.order.receipt_number)
