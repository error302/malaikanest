import sys
from django.core.management.base import BaseCommand
from apps.products.models import Category

class Command(BaseCommand):
    help = 'Seeds the database with standard Baby & Maternity product categories'

    def handle(self, *args, **kwargs):
        from apps.products.models import Category

        if Category.objects.exists():
            self.stdout.write(self.style.WARNING('Categories already exist — skipping seeding.'))
            return
        categories = [
            # Clothing & Apparel
            "Clothing & Apparel",
            "Newborn (0-3 Months)",
            "Infant (3-12 Months)",
            "Toddler (1-3 Years)",
            # Feeding & Nursing
            "Feeding & Nursing",
            "Bottle Feeding",
            "Breastfeeding",
            "Solid Foods",
            "Bibs & Burp Cloths",
            # Diapering & Potty
            "Diapering & Potty",
            "Diapers",
            "Diaper Accessories",
            "Potty Training",
            # Nursery & Sleep
            "Nursery & Sleep",
            "Nursery Furniture",
            "Nursery Bedding",
            "Nursery Decor & Lighting",
            "Monitors & Safety",
            # Gear & Travel
            "Gear & Travel",
            "Strollers",
            "Car Seats",
            "Carriers",
            "Diaper Bags",
            # Bath & Skin Care
            "Bath & Skin Care",
            "Baby Bath Time",
            "Baby Skin Care",
            "Baby Grooming",
            # Toys & Learning
            "Toys & Learning",
            "Infant Toys",
            "Developmental Toys",
            "Toddler Toys",
            # Maternity & Mom
            "Maternity & Mom",
            "Maternity Clothing",
            "Maternity Support & Comfort",
            "Postpartum Care",
            # Gifts & Sets
            "Gifts & Sets",
            "Baby Shower Gifts",
            "Starter Sets",
        ]

        created_count = 0
        exists_count = 0

        for cat_name in categories:
            obj, created = Category.objects.get_or_create(name=cat_name)
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created category: {cat_name}'))
            else:
                exists_count += 1
                self.stdout.write(self.style.WARNING(f'Category already exists: {cat_name}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded categories. {created_count} created, {exists_count} already existed.'))
