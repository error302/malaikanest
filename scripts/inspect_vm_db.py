import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Category, Product

print("=== CATEGORIES ===")
for c in Category.objects.all():
    print(c.name, "-> slug:", c.slug, "-> image:", c.image.url if c.image else "NONE")

print("\n=== PRODUCTS ===")
print("Count:", Product.objects.count())
for p in Product.objects.all():
    print("-", p.name, "(Category:", p.category.name if p.category else "None", ")")
