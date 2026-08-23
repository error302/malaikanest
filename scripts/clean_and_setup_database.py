import os
import django
from django.core.cache import cache

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product, Category, ProductVariant, Review, Wishlist

# 1. Clean test cart, payment, and order references first
print("Cleaning test cart, payment, and order references...")
from apps.payments.models import Payment
from apps.orders.models import CartItem, OrderItem, Cart, Order
Payment.objects.all().delete()
CartItem.objects.all().delete()
OrderItem.objects.all().delete()
Order.objects.all().delete()
Cart.objects.all().delete()

# 2. Remove all dummy / placeholder products cleanly
print("Removing placeholder products...")
deleted_products = Product.objects.all().delete()
print(f"Deleted products count: {deleted_products}")

# 3. Clean up old/messy categories and establish clean canonical categories
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("TRUNCATE TABLE products_category CASCADE;")

canonical_categories = [
    {'name': 'Baby Clothing', 'slug': 'baby-clothing', 'group': 'Clothing'},
    {'name': 'Baby Essentials', 'slug': 'baby-essentials', 'group': 'Essentials'},
    {'name': 'Nursery & Gear', 'slug': 'nursery-gear', 'group': 'Nursery'},
    {'name': 'Toys & Learning', 'slug': 'toys-learning', 'group': 'Toys'},
    {'name': 'Gifts & Bundles', 'slug': 'gifts-bundles', 'group': 'Gifts'},
    {'name': 'Travel & Strollers', 'slug': 'travel', 'group': 'Travel'},
    {'name': 'Thrifted & Pre-loved', 'slug': 'thrifted', 'group': 'Thrifted'},
]

for cat_data in canonical_categories:
    cat = Category.objects.create(
        name=cat_data['name'],
        slug=cat_data['slug'],
        group=cat_data['group']
    )
    print(f"[CREATED] Category: {cat.name} ({cat.slug})")

# 3. Clear Redis cache
cache.clear()
print("Redis cache completely cleared!")
print("Database is clean and ready for user's real inventory!")
