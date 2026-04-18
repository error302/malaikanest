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


def _column_exists(table: str, column: str) -> bool:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = %s AND column_name = %s "
            "LIMIT 1;",
            [table, column],
        )
        return cursor.fetchone() is not None


def _add_column_if_missing(table: str, column: str, sql_type: str) -> None:
    if _column_exists(table, column):
        print(f"OK: {table}.{column} exists")
        return

    with connection.cursor() as cursor:
        cursor.execute(f'ALTER TABLE "{table}" ADD COLUMN "{column}" {sql_type};')

    print(f"FIXED: added {table}.{column} ({sql_type})")


def main() -> None:
    with transaction.atomic():
        _add_column_if_missing("products_brand", "updated_at", "timestamp with time zone")


if __name__ == "__main__":
    main()
