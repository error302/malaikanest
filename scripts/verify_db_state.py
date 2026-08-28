import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Category, Product

print("=== DATABASE STATUS ===")
print(f"Total Categories: {Category.objects.count()}")
for c in Category.objects.all():
    print(f" - {c.name} (slug: {c.slug}, group: {c.group})")

print(f"\nTotal Products: {Product.objects.count()}")
