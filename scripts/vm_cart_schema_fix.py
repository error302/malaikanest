import os
import sys

BACKEND_DIR = os.environ.get("MALAIKA_BACKEND_DIR", "/home/mohameddosho20/malaikanest/backend")
os.chdir(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ.setdefault("DJANGO_ENV", "prod")

import django  # noqa: E402

django.setup()

from django.db import connection, transaction  # noqa: E402


def column_exists(table: str, column: str) -> bool:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s AND column_name = %s
            LIMIT 1
            """,
            [table, column],
        )
        return cursor.fetchone() is not None


def add_timestamptz_column_if_missing(table: str, column: str) -> None:
    if column_exists(table, column):
        print(f"OK: {table}.{column} exists")
        return

    with connection.cursor() as cursor:
        cursor.execute(
            f'ALTER TABLE "{table}" ADD COLUMN "{column}" timestamp with time zone NULL;'
        )
        cursor.execute(
            f'UPDATE "{table}" SET "{column}" = NOW() WHERE "{column}" IS NULL;'
        )
        cursor.execute(
            f'ALTER TABLE "{table}" ALTER COLUMN "{column}" SET DEFAULT NOW();'
        )

    print(f"FIXED: added {table}.{column}")


def main() -> None:
    with transaction.atomic():
        for table in ("orders_cart", "orders_cartitem", "orders_coupon"):
            add_timestamptz_column_if_missing(table, "updated_at")


if __name__ == "__main__":
    main()
