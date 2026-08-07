from django.db import migrations
from psycopg2 import sql

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
                sql.SQL(
                    "ALTER TABLE {} ADD COLUMN IF NOT EXISTS created_at timestamptz"
                ).format(sql.Identifier(table))
            )
            cursor.execute(
                sql.SQL(
                    "ALTER TABLE {} ADD COLUMN IF NOT EXISTS updated_at timestamptz"
                ).format(sql.Identifier(table))
            )
            cursor.execute(
                sql.SQL(
                    "UPDATE {} SET created_at = COALESCE(created_at, NOW()), updated_at = COALESCE(updated_at, NOW())"
                ).format(sql.Identifier(table))
            )
            cursor.execute(
                sql.SQL(
                    "ALTER TABLE {} ALTER COLUMN created_at SET DEFAULT NOW()"
                ).format(sql.Identifier(table))
            )
            cursor.execute(
                sql.SQL(
                    "ALTER TABLE {} ALTER COLUMN updated_at SET DEFAULT NOW()"
                ).format(sql.Identifier(table))
            )
            cursor.execute(
                sql.SQL("ALTER TABLE {} ALTER COLUMN created_at SET NOT NULL").format(
                    sql.Identifier(table)
                )
            )
            cursor.execute(
                sql.SQL("ALTER TABLE {} ALTER COLUMN updated_at SET NOT NULL").format(
                    sql.Identifier(table)
                )
            )


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(add_missing_timestamps, migrations.RunPython.noop),
    ]
