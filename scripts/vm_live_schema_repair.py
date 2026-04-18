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


def exec_sql(sql: str) -> None:
    with connection.cursor() as cursor:
        cursor.execute(sql)


def add_column_if_missing(table: str, column: str, sql_type: str) -> None:
    if column_exists(table, column):
        print(f"OK: {table}.{column}")
        return
    exec_sql(f'ALTER TABLE "{table}" ADD COLUMN "{column}" {sql_type};')
    print(f"FIXED: added {table}.{column}")


def ensure_timestamp(table: str, column: str) -> None:
    if not column_exists(table, column):
        exec_sql(f'ALTER TABLE "{table}" ADD COLUMN "{column}" timestamp with time zone NULL;')
        exec_sql(f'UPDATE "{table}" SET "{column}" = NOW() WHERE "{column}" IS NULL;')
        exec_sql(f'ALTER TABLE "{table}" ALTER COLUMN "{column}" SET DEFAULT NOW();')
        print(f"FIXED: added {table}.{column}")
    else:
        print(f"OK: {table}.{column}")


def ensure_coupon_columns() -> None:
    add_column_if_missing("orders_coupon", "discount_value", "numeric(10,2) NULL")
    if column_exists("orders_coupon", "amount"):
        exec_sql(
            'UPDATE "orders_coupon" SET "discount_value" = "amount" '
            'WHERE "discount_value" IS NULL;'
        )

    add_column_if_missing("orders_coupon", "min_order_value", "numeric(10,2) NULL")
    if column_exists("orders_coupon", "min_order_amount"):
        exec_sql(
            'UPDATE "orders_coupon" SET "min_order_value" = "min_order_amount" '
            'WHERE "min_order_value" IS NULL;'
        )

    add_column_if_missing("orders_coupon", "max_uses", "integer NULL")
    if column_exists("orders_coupon", "usage_limit"):
        exec_sql(
            'UPDATE "orders_coupon" SET "max_uses" = "usage_limit" '
            'WHERE "max_uses" IS NULL;'
        )

    add_column_if_missing("orders_coupon", "used_count", "integer NULL")
    if column_exists("orders_coupon", "times_used"):
        exec_sql(
            'UPDATE "orders_coupon" SET "used_count" = "times_used" '
            'WHERE "used_count" IS NULL;'
        )
    exec_sql('UPDATE "orders_coupon" SET "used_count" = 0 WHERE "used_count" IS NULL;')

    add_column_if_missing("orders_coupon", "is_active", "boolean NULL")
    if column_exists("orders_coupon", "active"):
        exec_sql(
            'UPDATE "orders_coupon" SET "is_active" = "active" '
            'WHERE "is_active" IS NULL;'
        )
    exec_sql('UPDATE "orders_coupon" SET "is_active" = TRUE WHERE "is_active" IS NULL;')

    add_column_if_missing("orders_coupon", "valid_from", "timestamp with time zone NULL")
    add_column_if_missing("orders_coupon", "valid_to", "timestamp with time zone NULL")


def ensure_cart_columns() -> None:
    add_column_if_missing("orders_cart", "coupon_id", "bigint NULL")
    add_column_if_missing("orders_cart", "coupon_applied_at", "timestamp with time zone NULL")
    add_column_if_missing("orders_cart", "delivery_region", "varchar(20) NULL")
    exec_sql(
        "UPDATE \"orders_cart\" SET \"delivery_region\" = 'nairobi' "
        "WHERE \"delivery_region\" IS NULL OR \"delivery_region\" = '';"
    )
    exec_sql(
        'ALTER TABLE "orders_cart" ALTER COLUMN "delivery_region" SET DEFAULT \'nairobi\';'
    )


def ensure_cartitem_columns() -> None:
    ensure_timestamp("orders_cartitem", "created_at")
    ensure_timestamp("orders_cartitem", "updated_at")
    add_column_if_missing("orders_cartitem", "variant_id", "bigint NULL")


def ensure_banner_columns() -> None:
    ensure_timestamp("products_banner", "updated_at")
    ensure_timestamp("products_brand", "updated_at")


def main() -> None:
    with transaction.atomic():
        ensure_timestamp("orders_cart", "updated_at")
        ensure_timestamp("orders_coupon", "updated_at")
        ensure_coupon_columns()
        ensure_cart_columns()
        ensure_cartitem_columns()
        ensure_banner_columns()


if __name__ == "__main__":
    main()
