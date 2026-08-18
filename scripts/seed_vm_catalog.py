import os
import glob
import django
from django.core.files import File
from django.utils.text import slugify

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product, Category, ProductVariant, Brand

# Define canonical categories
cat_clothing, _ = Category.objects.get_or_create(
    slug='baby-clothing',
    defaults={'name': 'Baby Clothing', 'group': 'Clothing'}
)
cat_essentials, _ = Category.objects.get_or_create(
    slug='baby-essentials',
    defaults={'name': 'Baby Essentials', 'group': 'Essentials'}
)
cat_nursery, _ = Category.objects.get_or_create(
    slug='nursery-gear',
    defaults={'name': 'Nursery & Gear', 'group': 'Nursery'}
)
cat_toys, _ = Category.objects.get_or_create(
    slug='toys-gifts',
    defaults={'name': 'Toys & Gifts', 'group': 'Toys'}
)

products_data = [
    {
        'name': 'Soft Organic Cotton Baby Onesie Set',
        'price': 1850.00,
        'compare_price': 2200.00,
        'category': cat_clothing,
        'age_group': 'baby',
        'age_range': '0-3m',
        'gender': 'unisex',
        'description': 'Ultra-soft 100% organic cotton onesie set for newborns and infants. Hypoallergenic, breathable, and gentle on sensitive baby skin. Includes snap buttons for quick and easy diaper changes.',
        'featured': True,
        'variants': [
            {'size': '0-3m', 'color': 'white'},
            {'size': '3-6m', 'color': 'white'},
            {'size': '0-3m', 'color': 'green'},
            {'size': '3-6m', 'color': 'green'},
            {'size': '0-3m', 'color': 'yellow'},
        ]
    },
    {
        'name': 'Cozy Animal Print Baby Romper',
        'price': 2100.00,
        'compare_price': 2500.00,
        'category': cat_clothing,
        'age_group': 'baby',
        'age_range': '3-6m',
        'gender': 'unisex',
        'description': 'Adorable animal print romper with snap buttons for easy diaper changes. Perfect for daily play and cozy naptime in coastal breeze.',
        'featured': True,
        'variants': [
            {'size': '0-3m', 'color': 'beige'},
            {'size': '3-6m', 'color': 'beige'},
            {'size': '6-9m', 'color': 'beige'},
            {'size': '3-6m', 'color': 'green'},
        ]
    },
    {
        'name': 'Pastel Floral Toddler Dress',
        'price': 2650.00,
        'compare_price': 3100.00,
        'category': cat_clothing,
        'age_group': 'toddler',
        'age_range': '1-2y',
        'gender': 'girl',
        'description': 'Charming pastel floral print dress crafted with lightweight, breathable fabric. Ideal for birthday parties, family gatherings, and weekend outings.',
        'featured': True,
        'variants': [
            {'size': '1-2y', 'color': 'pink'},
            {'size': '2-4y', 'color': 'pink'},
            {'size': '1-2y', 'color': 'purple'},
            {'size': '2-4y', 'color': 'purple'},
        ]
    },
    {
        'name': 'Little Explorer Denim Overall Set',
        'price': 2950.00,
        'compare_price': 3500.00,
        'category': cat_clothing,
        'age_group': 'toddler',
        'age_range': '2-4y',
        'gender': 'boy',
        'description': 'Durable, soft stretch denim overalls paired with a cute striped cotton shirt. Stylish and comfortable for active outdoor adventures.',
        'featured': True,
        'variants': [
            {'size': '1-2y', 'color': 'blue'},
            {'size': '2-4y', 'color': 'blue'},
            {'size': '4-6y', 'color': 'blue'},
        ]
    },
    {
        'name': 'Knit Baby Booties & Beanie Gift Set',
        'price': 1450.00,
        'compare_price': 1800.00,
        'category': cat_essentials,
        'age_group': 'baby',
        'age_range': 'newborn',
        'gender': 'unisex',
        'description': 'Handcrafted soft knit beanie and matching booties set. Keeps little heads and toes warm during cool mornings in Mombasa.',
        'featured': True,
        'variants': [
            {'size': '0-3m', 'color': 'beige'},
            {'size': '0-3m', 'color': 'pink'},
            {'size': '0-3m', 'color': 'blue'},
        ]
    },
    {
        'name': 'Plush Huggable Teddy Bear & Blanket Set',
        'price': 3200.00,
        'compare_price': 3800.00,
        'category': cat_toys,
        'age_group': 'baby',
        'age_range': '0-3m',
        'gender': 'unisex',
        'description': 'Super soft plush teddy bear companion paired with a double-layered fleece security blanket. The ultimate comfort gift for newborn arrivals.',
        'featured': True,
        'variants': [
            {'size': 'one-size', 'color': 'brown'},
            {'size': 'one-size', 'color': 'beige'},
        ]
    },
    {
        'name': 'Silicone Baby Feeding & Bib Set',
        'price': 2400.00,
        'compare_price': 2800.00,
        'category': cat_essentials,
        'age_group': 'baby',
        'age_range': '6-12m',
        'gender': 'unisex',
        'description': 'Food-grade BPA-free silicone suction bowl, divider plate, bib, and ergonomic spoon. Mess-free self-feeding for babies starting solids.',
        'featured': True,
        'variants': [
            {'size': 'one-size', 'color': 'orange'},
            {'size': 'one-size', 'color': 'green'},
            {'size': 'one-size', 'color': 'yellow'},
        ]
    },
    {
        'name': 'Breathable Mesh Baby Carrier',
        'price': 4800.00,
        'compare_price': 5500.00,
        'category': cat_nursery,
        'age_group': 'baby',
        'age_range': '0-3m',
        'gender': 'unisex',
        'description': 'Ergonomic 3D mesh baby carrier supporting healthy M-position hip development. Adjustable padded straps with lumbar support for parents.',
        'featured': True,
        'variants': [
            {'size': 'one-size', 'color': 'black'},
            {'size': 'one-size', 'color': 'gray'},
        ]
    },
    {
        'name': 'Wooden Montessori Stacking & Sorting Toy',
        'price': 2150.00,
        'compare_price': 2600.00,
        'category': cat_toys,
        'age_group': 'toddler',
        'age_range': '1-2y',
        'gender': 'unisex',
        'description': 'Natural non-toxic wooden shape sorting toy. Encourages fine motor skills, hand-eye coordination, and color recognition.',
        'featured': True,
        'variants': [
            {'size': 'one-size', 'color': 'multi'},
            {'size': 'one-size', 'color': 'brown'},
        ]
    },
    {
        'name': 'Soft Muslin Swaddle Blanket (Pack of 3)',
        'price': 2750.00,
        'compare_price': 3200.00,
        'category': cat_essentials,
        'age_group': 'baby',
        'age_range': 'newborn',
        'gender': 'unisex',
        'description': 'Generously sized 120cm x 120cm bamboo-muslin swaddles. Multi-use as stroller cover, nursing cover, or sunshade.',
        'featured': True,
        'variants': [
            {'size': 'one-size', 'color': 'beige'},
            {'size': 'one-size', 'color': 'pink'},
        ]
    },
]

image_paths = sorted(
    glob.glob('/product_images/*.jpeg') +
    glob.glob('/product_images/*.jpg') +
    glob.glob('/home/opc/malaikanest/product_images/*.jpeg')
)
print(f"Found {len(image_paths)} image files.")

for idx, item in enumerate(products_data):
    slug = slugify(item['name'])
    product, created = Product.objects.get_or_create(
        slug=slug,
        defaults={
            'name': item['name'],
            'price': item['price'],
            'compare_price': item['compare_price'],
            'category': item['category'],
            'age_group': item['age_group'],
            'age_range': item.get('age_range', ''),
            'gender': item['gender'],
            'description': item['description'],
            'featured': item['featured'],
            'stock': 25,
            'status': 'published',
            'is_active': True,
        }
    )
    product.name = item['name']
    product.price = item['price']
    product.compare_price = item['compare_price']
    product.category = item['category']
    product.age_group = item['age_group']
    product.age_range = item.get('age_range', '')
    product.gender = item['gender']
    product.description = item['description']
    product.featured = item['featured']
    product.stock = 25
    product.status = 'published'
    product.is_active = True

    if image_paths and (not product.image or 'default' in product.image.name or created):
        img_file = image_paths[idx % len(image_paths)]
        clean_filename = f"product_{idx+1}.jpg"
        with open(img_file, 'rb') as f:
            product.image.save(clean_filename, File(f), save=False)

    product.save()

    # Create Product Variants
    for v_data in item.get('variants', []):
        v_sku = f"{slug[:8].upper()}-{v_data.get('size', '').upper()}-{v_data.get('color', '')[:3].upper()}"
        variant, v_created = ProductVariant.objects.get_or_create(
            product=product,
            size=v_data.get('size', ''),
            color=v_data.get('color', ''),
            defaults={
                'sku': v_sku,
                'price_modifier': 0,
                'is_active': True,
            }
        )
        variant.sku = v_sku
        variant.price_modifier = 0
        variant.is_active = True
        variant.save()

    print(f"[{'CREATED' if created else 'UPDATED'}] {product.name} (Variants: {product.variants.count()}, Stock: {product.stock})")

print(f"\nAll {len(products_data)} products successfully seeded with variants and categories!")

