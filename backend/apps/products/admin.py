from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, Inventory, Review, Wishlist, Banner, Brand


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'group', 'is_top_level')
    search_fields = ('name', 'slug', 'group')
    list_filter = ('group', 'parent')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    search_fields = ('name', 'slug')
    list_filter = ('is_active',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'brand', 'price', 'discount_price', 'stock', 'is_active', 'featured')
    list_filter = ('is_active', 'featured', 'status', 'gender', 'category', 'brand')
    search_fields = ('name', 'sku', 'description')
    list_editable = ('is_active', 'featured')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'slug', 'sku', 'category', 'brand')
        }),
        ('Pricing', {
            'fields': ('price', 'discount_price', 'stock', 'low_stock_threshold')
        }),
        ('Details', {
            'fields': ('description', 'gender', 'age_range', 'weight')
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
    search_fields = ('user_email', 'product__name')
    readonly_fields = ('created_at',)


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'position', 'start_date', 'end_date')
    list_filter = ('is_active',)
    list_editable = ('is_active', 'position')
    search_fields = ('title', 'subtitle')
    readonly_fields = ('created_at',)
    ordering = ('position',)
