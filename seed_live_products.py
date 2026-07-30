import os
import shutil
import glob
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product, Category, ProductVariant, Brand
from django.utils.text import slugify

cat_clothing, _ = Category.objects.get_or_create(name='Baby Clothing', defaults={'slug': 'baby-clothing', 'group': 'Clothing'})
cat_essentials, _ = Category.objects.get_or_create(name='Baby Essentials', defaults={'slug': 'baby-essentials', 'group': 'Essentials'})
cat_nursery, _ = Category.objects.get_or_create(name='Nursery & Gear', defaults={'slug': 'nursery-gear', 'group': 'Nursery'})
cat_toys, _ = Category.objects.get_or_create(name='Toys & Gifts', defaults={'slug': 'toys-gifts', 'group': 'Toys'})

products_data = [
    {
        'name': 'Soft Organic Cotton Baby Onesie Set',
        'price': 1850.00,
        'compare_price': 2200.00,
        'category': cat_clothing,
        'age_group': 'baby',
        'gender': 'unisex',
        'description': 'Ultra-soft 100% organic cotton onesie set for newborns and infants. Hypoallergenic, breathable, and gentle on sensitive baby skin.',
        'featured': True,
    },
    {
        'name': 'Cozy Animal Print Baby Romper',
        'price': 2100.00,
        'compare_price': 2500.00,
        'category': cat_clothing,
        'age_group': 'baby',
        'gender': 'unisex',
        'description': 'Adorable animal print romper with snap buttons for easy diaper changes. Perfect for daily play and cozy naptime.',
        'featured': True,
    },
    {
        'name': 'Pastel Floral Toddler Dress',
        'price': 2650.00,
        'compare_price': 3100.00,
        'category': cat_clothing,
        'age_group': 'toddler',
        'gender': 'girl',
        'description': 'Charming pastel floral print dress crafted with lightweight, breathable fabric. Ideal for birthday parties and family gatherings.',
        'featured': True,
    },
    {
        'name': 'Little Explorer Denim Overall Set',
        'price': 2950.00,
        'compare_price': 3500.00,
        'category': cat_clothing,
        'age_group': 'toddler',
        'gender': 'boy',
        'description': 'Durable, soft stretch denim overalls paired with a cute striped cotton shirt. Stylish and comfortable for outdoor adventures.',
        'featured': True,
    },
    {
        'name': 'Knit Baby Booties & Beanie Gift Set',
        'price': 1450.00,
        'compare_price': 1800.00,
        'category': cat_essentials,
        'age_group': 'baby',
        'gender': 'unisex',
        'description': 'Handcrafted soft knit beanie and matching booties set. Keeps little heads and toes warm during cool mornings in Mombasa.',
        'featured': True,
    },
    {
        'name': 'Plush Huggable Teddy Bear & Blanket Set',
        'price': 3200.00,
        'compare_price': 3800.00,
        'category': cat_toys,
        'age_group': 'baby',
        'gender': 'unisex',
        'description': 'Super soft plush teddy bear companion paired with a double-layered fleece security blanket.',
        'featured': True,
    },
    {
        'name': 'Silicone Baby Feeding & Bib Set',
        'price': 2400.00,
        'compare_price': 2800.00,
        'category': cat_essentials,
        'age_group': 'baby',
        'gender': 'unisex',
        'description': 'Food-grade BPA-free silicone suction bowl, divider plate, bib, and ergonomic spoon. Mess-free self-feeding for babies.',
        'featured': True,
    },
    {
        'name': 'Breathable Mesh Baby Carrier',
        'price': 4800.00,
        'compare_price': 5500.00,
        'category': cat_nursery,
        'age_group': 'baby',
        'gender': 'unisex',
        'description': 'Ergonomic 3D mesh baby carrier supporting M-position hip development. Adjustable straps for parents with lumbar support.',
        'featured': True,
    },
    {
        'name': 'Wooden Montessori Stacking & Sorting Toy',
        'price': 2150.00,
        'compare_price': 2600.00,
        'category': cat_toys,
        'age_group': 'toddler',
        'gender': 'unisex',
        'description': 'Natural non-toxic wooden shape sorting toy. Encourages fine motor skills, hand-eye coordination, and color recognition.',
        'featured': True,
    },
    {
        'name': 'Soft Muslin Swaddle Blanket (Pack of 3)',
        'price': 2750.00,
        'compare_price': 3200.00,
        'category': cat_essentials,
        'age_group': 'baby',
        'gender': 'unisex',
        'description': 'Generously sized 120cm x 120cm bamboo-muslin swaddles. Multi-use as stroller cover, nursing cover, or sunshade.',
        'featured': True,
    },
]

image_files = sorted(glob.glob('/home/opc/malaikanest/product_images/*.jpeg'))
media_dir = '/code/media/products'
os.makedirs(media_dir, exist_ok=True)

print(f"Found {len(image_files)} image files to process.")

for idx, item in enumerate(products_data):
    img_path = image_files[idx % len(image_files)]
    filename = f"product_{idx+1}_{os.path.basename(img_path)}"
    dest_path = os.path.join(media_dir, filename)
    shutil.copy(img_path, dest_path)
    
    relative_img_url = f"products/{filename}"
    slug = slugify(item['name'])
    
    product, created = Product.objects.get_or_create(
        slug=slug,
        defaults={
            'name': item['name'],
            'price': item['price'],
            'compare_price': item['compare_price'],
            'category': item['category'],
            'age_group': item['age_group'],
            'gender': item['gender'],
            'description': item['description'],
            'featured': item['featured'],
            'stock': 25,
            'status': 'published',
            'is_active': True,
            'image': relative_img_url,
        }
    )
    if not created:
        product.name = item['name']
        product.price = item['price']
        product.compare_price = item['compare_price']
        product.category = item['category']
        product.age_group = item['age_group']
        product.gender = item['gender']
        product.description = item['description']
        product.featured = item['featured']
        product.stock = 25
        product.status = 'published'
        product.is_active = True
        product.image = relative_img_url
        product.save()

    status_str = 'Created' if created else 'Updated'
    print(f"[{status_str}] {product.name} -> {relative_img_url}")

print("All products successfully seeded!")
