import os
import sys

BACKEND_DIR = os.environ.get("MALAIKA_BACKEND_DIR", "/home/mohameddosho20/malaikanest/backend")
os.chdir(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ.setdefault("DJANGO_ENV", "prod")

import django  # noqa: E402

django.setup()

from django.db import connection  # noqa: E402


def print_table_schema(table: str) -> None:
    print(f"\n== {table} ==")
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name, data_type, udt_name, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position;
            """,
            [table],
        )
        for row in cursor.fetchall():
            print(row)


def main() -> None:
    print_table_schema("products_category")
    print_table_schema("products_brand")
    print_table_schema("orders_cart")
    print_table_schema("orders_cartitem")
    print_table_schema("orders_coupon")


if __name__ == "__main__":
    main()
