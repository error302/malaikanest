from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.products.models import Product


# Match the live demo seed by both slug and its original stock photo.
DEMO_PHOTOS = {
    "lightweight-stroller": "1591088398332-8a7791972843",
    "infant-car-seat": "1544816155-12df9643f363",
    "baby-carrier-sling": "1519689680058-324335c77eba",
    "organic-ribbed-sleepsuit": "1522771930-78848d9293e8",
    "kimono-bodysuit-3-pack": "1515488042361-ee00e0ddd4e4",
    "knitted-cotton-baby-blanket": "1555252333-9f8e92e65df9",
    "soft-bamboo-waffle-romper": "1505377059067-e285a7bac49b",
    "newborn-welcome-gift-hamper": "1513151233558-d860c5398176",
}


class Command(BaseCommand):
    help = "List or unpublish the verified stock-photo demo catalogue. Products and sales history are retained."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true", help="Hide the matching products from the shop.")

    @transaction.atomic
    def handle(self, *args, **options):
        seed = Q()
        for slug, photo in DEMO_PHOTOS.items():
            seed |= Q(slug=slug, image_url=f"https://images.unsplash.com/photo-{photo}?auto=format&fit=crop&w=800&q=80")
        products = Product.objects.filter(seed).exclude(status="draft", is_active=False).order_by("slug")
        if options["apply"]:
            products = products.select_for_update()

        rows = list(products)
        for product in rows:
            self.stdout.write(f"{product.slug}: {product.name}")

        if options["apply"]:
            for product in rows:
                product.is_active = False
                product.status = "draft"
                product.updated_at = timezone.now()
                product.save(update_fields=["is_active", "status", "updated_at"])
            self.stdout.write(self.style.SUCCESS(f"Hidden {len(rows)} demo products."))
        else:
            self.stdout.write(f"{len(rows)} demo products would be hidden. Run with --apply to unpublish them.")
