import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product, ProductImage, Banner, Category

print("Fixing image fields in PostgreSQL database...")

updated_products = 0
for p in Product.objects.all():
    if p.image and hasattr(p.image, 'name') and p.image.name:
        name = p.image.name
        if not any(name.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']):
            p.image.name = f"{name}.jpg"
            p.save(update_fields=['image'])
            updated_products += 1

print(f"Updated {updated_products} products image field in DB!")

updated_gallery = 0
for pi in ProductImage.objects.all():
    if pi.image and hasattr(pi.image, 'name') and pi.image.name:
        name = pi.image.name
        if not any(name.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']):
            pi.image.name = f"{name}.jpg"
            pi.save(update_fields=['image'])
            updated_gallery += 1

print(f"Updated {updated_gallery} product images in DB!")
print("Database image paths successfully updated with .jpg extension!")
