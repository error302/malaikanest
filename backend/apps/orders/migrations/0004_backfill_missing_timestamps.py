from django.db import migrations


ORDER_TABLES = [
    "orders_coupon",
    "orders_invoice",
    "orders_order",
    "orders_orderitem",
    "orders_cart",
    "orders_cartitem",
]


def add_missing_timestamps(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        for table in ORDER_TABLES:
            cursor.execute(
                f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS created_at timestamptz"
            )
            cursor.execute(
                f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS updated_at timestamptz"
            )
            cursor.execute(
                f"UPDATE {table} SET created_at = COALESCE(created_at, NOW()), updated_at = COALESCE(updated_at, NOW())"
            )
            cursor.execute(
                f"ALTER TABLE {table} ALTER COLUMN created_at SET DEFAULT NOW()"
            )
            cursor.execute(
                f"ALTER TABLE {table} ALTER COLUMN updated_at SET DEFAULT NOW()"
            )
            cursor.execute(
                f"ALTER TABLE {table} ALTER COLUMN created_at SET NOT NULL"
            )
            cursor.execute(
                f"ALTER TABLE {table} ALTER COLUMN updated_at SET NOT NULL"
            )


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0003_coupon_and_cart_enhancements"),
    ]

    operations = [
        migrations.RunPython(add_missing_timestamps, migrations.RunPython.noop),
    ]
