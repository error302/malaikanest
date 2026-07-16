"""
Temporary helper: run Django checks against an in-memory SQLite DB so we can
validate the M3 fix without a live PostgreSQL connection.
"""
import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django
django.setup()

# Now override DATABASES via the test utility (post-setup).
from django.test.utils import override_settings
from django.core.management import call_command

with override_settings(DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}):
    print("=== check ===")
    rc1 = call_command("check", verbosity=2)

    print("\n=== makemigrations --check --dry-run ===")
    try:
        call_command("makemigrations", "--check", "--dry-run", verbosity=2)
        print("makemigrations --check: OK (no missing migrations)")
    except SystemExit as exc:
        print(f"makemigrations --check: exit code = {exc.code} (1 = missing migrations)")
        sys.exit(int(exc.code) if exc.code is not None else 1)

print("\nAll checks passed.")
