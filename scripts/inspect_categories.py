import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Category

print("=== ROOT CATEGORIES ===")
for c in Category.objects.filter(parent__isnull=True):
    img_val = c.image.url if c.image else (c.image.name if c.image else "NONE")
    print(f"ID: {c.id} | Name: '{c.name}' | Slug: '{c.slug}' | Image: {img_val}")
