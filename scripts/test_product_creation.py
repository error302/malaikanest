import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product, Category, ProductVariant

cat = Category.objects.filter(slug='baby-clothing').first()

product = Product.objects.create(
    name='Test Luxury Onesie',
    slug='test-luxury-onesie',
    price=1500.00,
    compare_price=1800.00,
    category=cat,
    age_group='baby',
    gender='unisex',
    description='Test product to verify admin and storefront compatibility.',
    featured=True,
    stock=20,
    status='published',
    is_active=True
)

variant = ProductVariant.objects.create(
    product=product,
    size='0-3m',
    color='white',
    sku='TEST-03M-WHT',
    price_modifier=0,
    is_active=True
)

print(f"Product successfully created: {product.name} (ID: {product.id}, Slug: {product.slug})")
print(f"Variant: {variant.size} - {variant.color} (SKU: {variant.sku})")

# Clean up test product
product.delete()
print("Test product deleted cleanly. Catalog remains at 0 products.")
