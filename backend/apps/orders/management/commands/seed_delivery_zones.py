from django.core.management.base import BaseCommand
from apps.orders.models import DeliveryZone


ZONES = [
    {"slug": "mombasa", "name": "Mombasa (Same Day)", "fee": 0, "estimated_days": "Same Day", "position": 0},
    {"slug": "nairobi", "name": "Nairobi (1-2 Days)", "fee": 300, "estimated_days": "1-2 Days", "position": 1},
    {"slug": "upcountry", "name": "Upcountry (2-3 Days)", "fee": 500, "estimated_days": "2-3 Days", "position": 2},
]


class Command(BaseCommand):
    help = "Seed default delivery zones"

    def handle(self, *args, **options):
        created = 0
        for zone in ZONES:
            _, is_new = DeliveryZone.objects.get_or_create(slug=zone["slug"], defaults=zone)
            if is_new:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} delivery zone(s)"))
