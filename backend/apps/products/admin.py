from django.contrib import admin
from django.utils.html import format_html
from django.utils.text import slugify

from .models import Category, Product, Inventory, ProductImage, ProductVariant, Review, Wishlist, Banner, Brand

import logging
import uuid

logger = logging.getLogger(__name__)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('image_preview', 'name', 'slug', 'group', 'is_top_level')
    search_fields = ('name', 'slug', 'group')
    list_filter = ('group', 'parent')
    prepopulated_fields = {'slug': ('name',)}

    def image_preview(self, obj):
        from django.utils.html import format_html
        url = None
        try:
            if obj.image:
                url = obj.image.url
        except Exception:
            url = None
        if url:
            return format_html('<img src="{}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;" />', url)
        return "—"
    image_preview.short_description = "Image"


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    search_fields = ('name', 'slug')
    list_filter = ('is_active',)
    prepopulated_fields = {'slug': ('name',)}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'is_primary', 'position')


class ProductVariantInline(admin.TabularInline):
    """Add size/colour combinations directly on the product page.

    Leave size or colour blank for products sold in a single form. Each
    variant automatically gets its own stock record — set the quantity in
    the Variant Inventory section (or leave it; stock syncs from Inventory).
    """
    model = ProductVariant
    extra = 1
    fields = ('size', 'color', 'price_modifier', 'image', 'is_active')
    show_change_link = True


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'brand', 'price', 'discount_price', 'stock', 'is_active', 'featured')
    list_filter = ('is_active', 'featured', 'status', 'gender', 'category', 'brand')
    search_fields = ('name', 'sku', 'description')
    list_editable = ('is_active', 'featured')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')
    inlines = (ProductImageInline, ProductVariantInline)
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'slug', 'sku', 'category', 'brand')
        }),
        ('Pricing', {
            'fields': ('price', 'discount_price', 'stock', 'low_stock_threshold')
        }),
        ('Details', {
            'fields': ('description', 'fabric', 'whats_included', 'gender', 'age_group', 'age_range', 'size_label', 'weight')
        }),
        ('Images', {
            'fields': ('image',)
        }),
        ('SEO', {
            'fields': ('seo_title', 'seo_description')
        }),
        ('Status', {
            'fields': ('is_active', 'featured', 'status')
        }),
    )


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'size', 'color', 'sku', 'price_modifier', 'is_active')
    list_filter = ('is_active', 'size', 'color', 'product__category')
    search_fields = ('product__name', 'sku')
    list_editable = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')

    def save_model(self, request, obj, form, change):
        # Auto-SKU so the shop owner never has to invent codes.
        if not obj.sku:
            base = slugify(obj.product.name)[:12].upper() or "VAR"
            suffix = uuid.uuid4().hex[:6].upper()
            parts = [p for p in (obj.size, obj.color) if p]
            obj.sku = f"{base}-{'-'.join(parts).upper()[:10]}-{suffix}" if parts else f"{base}-{suffix}"
        super().save_model(request, obj, form, change)
        self._ensure_inventory(obj)

    @staticmethod
    def _ensure_inventory(variant):
        """Every variant needs a VariantInventory row, or its stock shows as 0."""
        try:
            from .models import VariantInventory
            VariantInventory.objects.get_or_create(variant=variant)
        except Exception:
            logger.exception("Failed to ensure VariantInventory for %s", variant.pk)


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'reserved', 'available_display')
    search_fields = ('product__name',)
    readonly_fields = ('product',)

    def available_display(self, obj):
        return obj.available()
    available_display.short_description = 'Available'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user_email', 'rating', 'title', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__name', 'user_email', 'title')
    readonly_fields = ('created_at',)


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'product', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'product__name')
    readonly_fields = ('created_at',)

    def user_email(self, obj):
        return obj.user.email if obj.user else "Guest"
    user_email.short_description = 'User Email'


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'position', 'start_date', 'end_date')
    list_filter = ('is_active',)
    list_editable = ('is_active', 'position')
    search_fields = ('title', 'subtitle')
    readonly_fields = ('created_at',)
    ordering = ('position',)
