from django.db import migrations


PRODUCT_TABLES = [
    "products_brand",
    "products_category",
    "products_tag",
    "products_banner",
    "products_product",
    "products_inventory",
    "products_productvariant",
    "products_productimage",
    "products_variantinventory",
    "products_inventorylog",
    "products_review",
    "products_wishlist",
]


def add_missing_timestamps(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        for table in PRODUCT_TABLES:
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
        ("products", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(add_missing_timestamps, migrations.RunPython.noop),
    ]
