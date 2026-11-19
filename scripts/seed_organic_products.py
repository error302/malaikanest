import django
django.setup()

from apps.products.models import Product, Category
from decimal import Decimal

# 1. Update existing products
p1 = Product.objects.filter(slug='lightweight-stroller').first()
if p1:
    p1.status = 'published'
    p1.stock = 5
    p1.featured = True
    p1.image_url = 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'
    p1.description = 'Ultra-compact lightweight stroller engineered for smooth city strolls in Mombasa and Nairobi. Features one-hand fold, multi-recline seat, and UV50+ sun canopy.'
    p1.fabric = 'Lightweight aluminum frame with wipe-clean breathable polyester fabric.'
    p1.whats_included = '1x Stroller, 1x Rain cover, 1x Cup holder, 1x Padded bumper bar.'
    p1.save()
    print("Updated p1:", p1.name)

p2 = Product.objects.filter(slug='infant-car-seat').first()
if p2:
    p2.status = 'published'
    p2.stock = 4
    p2.featured = True
    p2.image_url = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
    p2.description = 'Rear-facing infant safety car seat with deep side-impact protection and removable newborn cushion insert. Isofix compatible.'
    p2.fabric = 'Breathable hypoallergenic mesh cushion, machine-washable at 30°C.'
    p2.whats_included = '1x Infant Car Seat, 1x Newborn Insert, 1x Sun Canopy.'
    p2.save()
    print("Updated p2:", p2.name)

p3 = Product.objects.filter(slug='baby-carrier-sling').first()
if p3:
    p3.status = 'published'
    p3.stock = 7
    p3.featured = True
    p3.image_url = 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80'
    p3.description = 'Ergonomic wrap sling designed to distribute weight evenly across parents shoulders and back while keeping your baby in the healthy M-position.'
    p3.fabric = '100% GOTS certified organic cotton with 5% elastane for natural flex.'
    p3.whats_included = '1x Baby Wrap Sling, 1x Illustrated tying guide.'
    p3.save()
    print("Updated p3:", p3.name)

# 2. Add organic baby clothes
clothing_cat = Category.objects.filter(slug='clothing').first() or Category.objects.first()
gifts_cat = Category.objects.filter(slug='gifts').first() or clothing_cat

clothes_data = [
    {
        "name": "Organic Ribbed Sleepsuit",
        "slug": "organic-ribbed-sleepsuit",
        "price": Decimal("1450.00"),
        "compare_price": Decimal("1800.00"),
        "category": clothing_cat,
        "age_range": "0-3 months",
        "size_label": "0-3m",
        "age_group": "baby",
        "gender": "unisex",
        "condition": "new",
        "status": "published",
        "stock": 10,
        "featured": True,
        "image_url": "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=800&q=80",
        "description": "Buttery-soft organic cotton ribbed sleepsuit with two-way front zipper for quick, fuss-free nighttime diaper changes. Fold-over scratch mitts on newborn sizes.",
        "fabric": "95% Organic Cotton, 5% Elastane. Machine wash cold, tumble dry low.",
        "whats_included": "1x Organic Ribbed Sleepsuit (Ivory / Natural Sand)"
    },
    {
        "name": "Kimono Bodysuit 3-Pack",
        "slug": "kimono-bodysuit-3-pack",
        "price": Decimal("2200.00"),
        "compare_price": Decimal("2600.00"),
        "category": clothing_cat,
        "age_range": "3-6 months",
        "size_label": "3-6m",
        "age_group": "baby",
        "gender": "unisex",
        "condition": "new",
        "status": "published",
        "stock": 12,
        "featured": True,
        "image_url": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80",
        "description": "Essential wrap-style kimono bodysuits that snap closed at the side without pulling over babys delicate head. Comes in gentle earthy hues.",
        "fabric": "100% Breathable GOTS Organic Cotton.",
        "whats_included": "3x Kimono Bodysuits (Oatmeal, Sage, Terracotta)"
    },
    {
        "name": "Knitted Cotton Baby Blanket",
        "slug": "knitted-cotton-baby-blanket",
        "price": Decimal("2800.00"),
        "compare_price": Decimal("3200.00"),
        "category": clothing_cat,
        "age_range": "0-3 months",
        "size_label": "one-size",
        "age_group": "baby",
        "gender": "unisex",
        "condition": "new",
        "status": "published",
        "stock": 8,
        "featured": True,
        "image_url": "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=800&q=80",
        "description": "Heirloom-quality cellular knit blanket crafted from pure combed cotton. Breathable cell structure keeps baby comfortable across both Mombasa heat and Nairobi cool nights.",
        "fabric": "100% Pure Combed Cotton (Dimensions: 100cm x 80cm).",
        "whats_included": "1x Heirloom Knit Blanket in gift ribbon"
    },
    {
        "name": "Soft Bamboo Waffle Romper",
        "slug": "soft-bamboo-waffle-romper",
        "price": Decimal("1650.00"),
        "category": clothing_cat,
        "age_range": "6-12 months",
        "size_label": "6-12m",
        "age_group": "baby",
        "gender": "unisex",
        "condition": "new",
        "status": "published",
        "stock": 7,
        "featured": True,
        "image_url": "https://images.unsplash.com/photo-1505377059067-e285a7bac49b?auto=format&fit=crop&w=800&q=80",
        "description": "Lightweight breathable waffle-knit romper featuring coconut shell buttons and snap leg closures for swift changes.",
        "fabric": "70% Bamboo Viscose, 30% Organic Cotton.",
        "whats_included": "1x Bamboo Waffle Romper"
    },
    {
        "name": "Newborn Welcome Gift Hamper",
        "slug": "newborn-welcome-gift-hamper",
        "price": Decimal("4800.00"),
        "compare_price": Decimal("5500.00"),
        "category": gifts_cat,
        "age_range": "0-3 months",
        "size_label": "one-size",
        "age_group": "baby",
        "gender": "unisex",
        "condition": "new",
        "status": "published",
        "stock": 5,
        "featured": True,
        "image_url": "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
        "description": "The ultimate baby shower gift. Presented in a handwoven Kenyan coastal palm basket with personalized greeting card.",
        "fabric": "100% Organic certified fabrics and eco-friendly wooden keepsakes.",
        "whats_included": "1x Ribbed Sleepsuit, 1x Swaddle, 1x Beechwood Rattle, 1x Handwoven Keepsake Basket"
    }
]

for item in clothes_data:
    p, created = Product.objects.update_or_create(
        slug=item["slug"],
        defaults=item
    )
    print(f"{'Created' if created else 'Updated'} product: {p.name} (KES {p.price})")

print("Finished! Total published products:", Product.objects.filter(status='published').count())
