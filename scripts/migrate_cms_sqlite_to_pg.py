#!/usr/bin/env python3
"""Migrate the Next.js CMS database from SQLite (legacy file:./dev.db or
the production frontend_cms_data volume) to PostgreSQL (malaika_cms).

One-time tool for the CMS SQLite -> PostgreSQL migration. Fully generic:
it discovers tables/columns from the SQLite file, inspects the target PG
types (so SQLite 0/1 integers are converted to real booleans), and copies
every row with ON CONFLICT DO NOTHING (idempotent, never overwrites rows
that already exist in PG).

FK-safe ordering is handled by copying tables in dependency order
(LoyaltyAccount before LoyaltyTransaction); everything else is order-free.

Usage:
    python scripts/migrate_cms_sqlite_to_pg.py \
        --sqlite frontend/prisma/dev.db \
        --dsn "postgresql://kenya:kenya_password@localhost:5432/malaika_cms?schema=public"

    # On the VM (inside a container that can reach both the sqlite file and PG):
    python scripts/migrate_cms_sqlite_to_pg.py --sqlite /path/to/cms.db \
        --dsn "postgresql://kenya:<pw>@db:5432/malaika_cms?schema=public" --dry-run
"""

import argparse
import sqlite3
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Tables that other tables reference via FK must come first.
# Names are the physical table names (@@map in prisma/schema.prisma).
TABLE_ORDER = [
    "site_settings",
    "content_blocks",
    "testimonials",
    "value_props",
    "thrifted_products",
    "blog_posts",
    "loyalty_accounts",
    "loyalty_transactions",
]


def quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite", required=True, help="Path to the source SQLite CMS db")
    parser.add_argument("--dsn", required=True, help="Target PostgreSQL DSN (malaika_cms)")
    parser.add_argument("--dry-run", action="store_true", help="Count rows only, write nothing")
    args = parser.parse_args()

    import psycopg2
    import psycopg2.extras

    src = sqlite3.connect(f"file:{args.sqlite}?mode=ro", uri=True)
    src.row_factory = sqlite3.Row

    pg = psycopg2.connect(args.dsn)
    pg.autocommit = False

    with pg.cursor() as cur:
        cur.execute(
            "SELECT table_name, column_name, data_type "
            "FROM information_schema.columns WHERE table_schema = 'public'"
        )
        pg_columns: dict[str, dict[str, str]] = {}
        for table, column, dtype in cur.fetchall():
            pg_columns.setdefault(table, {})[column] = dtype

    sqlite_tables = {
        row[0]
        for row in src.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
    }
    tables = [t for t in TABLE_ORDER if t in sqlite_tables]
    extra = sorted(sqlite_tables - set(TABLE_ORDER))
    if extra:
        print(f"! Skipping unknown SQLite tables: {', '.join(extra)}")

    grand_total = 0
    for table in tables:
        if table not in pg_columns:
            print(f"! {table}: missing in target PG schema — run `prisma db push` first")
            continue

        cols = [r[1] for r in src.execute(f'PRAGMA table_info("{table}")')]
        common = [c for c in cols if c in pg_columns[table]]
        dropped = [c for c in cols if c not in pg_columns[table]]
        if dropped:
            print(f"! {table}: columns not in PG (skipped): {', '.join(dropped)}")

        col_list = ", ".join(quote_ident(c) for c in common)
        rows = list(src.execute(f"SELECT {col_list} FROM {quote_ident(table)}"))
        print(f"→ {table}: {len(rows)} rows", end="")

        if args.dry_run or not rows:
            print(" (dry-run)" if args.dry_run else " (empty)")
            grand_total += 0 if args.dry_run else 0
            continue

        placeholders = ", ".join("%s" for _ in common)
        inserted = 0
        for row in rows:
            values = []
            for col, value in zip(common, row):
                dtype = pg_columns[table][col]
                if dtype == "boolean" and isinstance(value, int):
                    value = bool(value)
                elif dtype.startswith("timestamp") and isinstance(value, (int, float)):
                    # SQLite numeric timestamps (ms) -> ISO
                    import datetime

                    value = datetime.datetime.fromtimestamp(
                        value / 1000 if value > 1e11 else value, tz=datetime.timezone.utc
                    )
                elif value == "" and dtype in ("integer", "bigint", "double precision"):
                    value = None
                values.append(value)

            cur = pg.cursor()
            try:
                cur.execute(
                    f"INSERT INTO {quote_ident(table)} ({col_list}) "
                    f"VALUES ({placeholders}) ON CONFLICT DO NOTHING",
                    values,
                )
                inserted += cur.rowcount
            except Exception as exc:  # noqa: BLE001 — report and abort loudly
                pg.rollback()
                print(f"\n  FAILED row in {table}: {exc}")
                return 1

        pg.commit()
        print(f" → inserted {inserted} (skipped {len(rows) - inserted} existing)")
        grand_total += inserted

    print(f"\nDone. {grand_total} rows migrated into PostgreSQL.")
    src.close()
    pg.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
