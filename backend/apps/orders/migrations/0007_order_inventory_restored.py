from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0006_alter_coupon_code_alter_order_receipt_number_and_more"),
    ]

    operations = [
        # H3 fix: idempotency guard so a retried/duplicated restore_inventory task
        # cannot release/restock the same stock twice and create phantom inventory.
        migrations.AddField(
            model_name="order",
            name="inventory_restored",
            field=models.BooleanField(default=False),
        ),
    ]
