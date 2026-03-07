import os
from django.core.management.base import BaseCommand
from apps.products.models import Product, Category


class Command(BaseCommand):
    help = 'Seeds the database with sample baby products'

    def handle(self, *args, **kwargs):
        env = os.getenv("ENVIRONMENT", "development").strip().lower()
        if env in {"production", "prod", "live"}:
            self.stdout.write(self.style.WARNING("Skipping seed_products in production environment."))
            return

        from django.utils.text import slugify

        products_data = [
            {'name': 'Soft Cotton Onesies Pack', 'price': '1500', 'category': 'Newborn (0-3 Months)', 'description': 'Pack of 3 soft cotton onesies for newborns'},
            {'name': 'Newborn Baby Romper', 'price': '800', 'category': 'Newborn (0-3 Months)', 'description': 'Comfortable romper for newborn babies'},
            {'name': 'Infant Bodysuits Set', 'price': '1200', 'category': 'Infant (3-12 Months)', 'description': 'Set of 5 infant bodysuits'},
            {'name': 'Toddler T-Shirt', 'price': '600', 'category': 'Toddler (1-3 Years)', 'description': 'Cotton t-shirt for toddlers'},
            {'name': 'Premium Diapers Pack', 'price': '2500', 'category': 'Diapers', 'description': 'Pack of 50 premium diapers'},
            {'name': 'Baby Bottles Set', 'price': '1800', 'category': 'Bottle Feeding', 'description': 'Set of 3 baby bottles with nipples'},
            {'name': 'Lightweight Stroller', 'price': '15000', 'category': 'Strollers', 'description': 'Lightweight and foldable stroller'},
            {'name': 'Infant Car Seat', 'price': '8500', 'category': 'Car Seats', 'description': 'Safe and comfortable infant car seat'},
            {'name': 'Baby Carrier Sling', 'price': '3500', 'category': 'Baby Carriers', 'description': 'Comfortable baby carrier sling'},
            {'name': 'Nursery Crib', 'price': '25000', 'category': 'Nursery Furniture', 'description': 'Modern nursery crib with mattress'},
            {'name': 'Baby Bedding Set', 'price': '4500', 'category': 'Nursery Bedding', 'description': 'Complete baby bedding set'},
            {'name': 'Baby Lotion', 'price': '550', 'category': 'Baby Skin Care', 'description': 'Gentle baby lotion for sensitive skin'},
            {'name': 'Baby Shampoo', 'price': '450', 'category': 'Baby Skin Care', 'description': 'Tear-free baby shampoo'},
            {'name': 'Activity Gym Mat', 'price': '3200', 'category': 'Infant Toys', 'description': 'Soft activity gym mat for infants'},
            {'name': 'Stacking Toys Set', 'price': '850', 'category': 'Infant Toys', 'description': 'Colorful stacking toys for babies'},
            {'name': 'Maternity Dress', 'price': '2800', 'category': 'Maternity Clothing', 'description': 'Comfortable maternity dress'},
            {'name': 'Nursing Top', 'price': '1200', 'category': 'Maternity Clothing', 'description': 'Easy nursing top for breastfeeding'},
        ]

        created = 0
        for prod in products_data:
            category = Category.objects.filter(name=prod['category']).first()
            if category:
                base_slug = slugify(prod['name'])
                slug = base_slug
                counter = 1
                while Product.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1

                Product.objects.create(
                    name=prod['name'],
                    slug=slug,
                    price=prod['price'],
                    description=prod['description'],
                    category=category,
                    image='',
                    is_active=True,
                )
                created += 1
                self.stdout.write(f'Created: {prod["name"]}')

        self.stdout.write(self.style.SUCCESS(f'Successfully created {created} products'))
