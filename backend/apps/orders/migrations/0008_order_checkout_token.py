from django.db import migrations, models

import apps.orders.models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0007_order_inventory_restored"),
    ]

    operations = [
        # M3 fix: per-order unguessable secret for guest authorization.
        # Guest payment / view / tracking must present this token (or the
        # receipt_number) — never the guessable sequential order id paired
        # with a guessable/leakable guest_email. The default callable runs
        # once per existing row, so legacy orders are back-filled in place.
        migrations.AddField(
            model_name="order",
            name="checkout_token",
            field=models.CharField(
                db_index=True,
                default=apps.orders.models.generate_checkout_token,
                editable=False,
                max_length=64,
                unique=True,
            ),
        ),
    ]
