from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0008_order_checkout_token"),
    ]

    operations = [
        migrations.CreateModel(
            name="DeliveryZone",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("slug", models.SlugField(max_length=30, unique=True)),
                ("name", models.CharField(max_length=100)),
                ("fee", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("estimated_days", models.CharField(blank=True, default="", max_length=100)),
                ("is_active", models.BooleanField(default=True)),
                ("position", models.PositiveSmallIntegerField(default=0)),
            ],
            options={
                "verbose_name": "Delivery Zone",
                "verbose_name_plural": "Delivery Zones",
                "ordering": ["position", "name"],
            },
        ),
    ]
