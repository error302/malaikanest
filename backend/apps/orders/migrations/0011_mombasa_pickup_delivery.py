from django.db import migrations


def update_zones(apps, schema_editor):
    DeliveryZone = apps.get_model("orders", "DeliveryZone")
    # Update Mombasa to delivery with small fee
    DeliveryZone.objects.filter(slug="mombasa").update(
        name="Mombasa (Delivery)", fee=150, estimated_days="Same Day", position=1
    )
    # Create Mombasa pickup zone
    DeliveryZone.objects.get_or_create(
        slug="mombasa_pickup",
        defaults={
            "name": "Mombasa (Pick up at Shop)",
            "fee": 0,
            "estimated_days": "Same Day",
            "position": 0,
            "is_active": True,
        },
    )


def reverse_zones(apps, schema_editor):
    DeliveryZone = apps.get_model("orders", "DeliveryZone")
    DeliveryZone.objects.filter(slug="mombasa_pickup").delete()
    DeliveryZone.objects.filter(slug="mombasa").update(
        name="Mombasa (Same Day)", fee=0, estimated_days="Same Day", position=0
    )


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0010_seed_delivery_zones"),
    ]

    operations = [
        migrations.RunPython(update_zones, reverse_zones),
    ]
