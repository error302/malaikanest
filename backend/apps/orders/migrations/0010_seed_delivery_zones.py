from django.db import migrations


def seed_zones(apps, schema_editor):
    DeliveryZone = apps.get_model("orders", "DeliveryZone")
    defaults = [
        {"slug": "mombasa", "name": "Mombasa (Same Day)", "fee": 0, "estimated_days": "Same Day", "position": 0},
        {"slug": "nairobi", "name": "Nairobi (1-2 Days)", "fee": 300, "estimated_days": "1-2 Days", "position": 1},
        {"slug": "upcountry", "name": "Upcountry (2-3 Days)", "fee": 500, "estimated_days": "2-3 Days", "position": 2},
    ]
    for zone in defaults:
        DeliveryZone.objects.get_or_create(slug=zone["slug"], defaults=zone)


def unseed_zones(apps, schema_editor):
    DeliveryZone = apps.get_model("orders", "DeliveryZone")
    DeliveryZone.objects.filter(slug__in=["mombasa", "nairobi", "upcountry"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0009_deliveryzone"),
    ]

    operations = [
        migrations.RunPython(seed_zones, unseed_zones),
    ]
