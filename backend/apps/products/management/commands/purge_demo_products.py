from django.core.management.base import BaseCommand
from apps.products.models import Product


DEMO_PRODUCT_NAMES = [
    'Soft Cotton Onesies Pack',
    'Newborn Baby Romper',
    'Infant Bodysuits Set',
    'Toddler T-Shirt',
    'Premium Diapers Pack',
    'Baby Bottles Set',
    'Lightweight Stroller',
    'Infant Car Seat',
    'Baby Carrier Sling',
    'Nursery Crib',
    'Baby Bedding Set',
    'Baby Lotion',
    'Baby Shampoo',
    'Activity Gym Mat',
    'Stacking Toys Set',
    'Maternity Dress',
    'Nursing Top',
]


class Command(BaseCommand):
    help = 'Remove seeded/demo products from database.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='List products that would be removed without deleting.')

    def handle(self, *args, **options):
        qs = Product.objects.filter(name__in=DEMO_PRODUCT_NAMES)
        count = qs.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS('No demo products found.'))
            return

        self.stdout.write(f'Found {count} demo product(s):')
        for p in qs.order_by('id'):
            self.stdout.write(f' - #{p.id} {p.name} ({p.slug})')

        if options['dry_run']:
            self.stdout.write(self.style.WARNING('Dry run complete. No products deleted.'))
            return

        deleted, _ = qs.delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {deleted} record(s).'))
