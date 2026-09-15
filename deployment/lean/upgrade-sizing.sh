#!/usr/bin/env bash
set -euo pipefail
cd /home/admin/malaikanest
backup=/home/admin/malaikanest-backups/size-first-20260914
mkdir -p "$backup"
chmod 700 "$backup"
if [ ! -f "$backup/before.sql.gz" ]; then
  docker exec malaikanest-db-1 pg_dump -U malaika_user malaika_production | gzip > "$backup/before.sql.gz"
  gzip -t "$backup/before.sql.gz"
  tar -czf "$backup/source.tar.gz" backend/apps/products/admin.py backend/apps/products/models.py backend/apps/storefront/views.py backend/templates/storefront/base.html backend/templates/storefront/product_list.html backend/templates/storefront/product_detail.html
  docker inspect malaikanest-web-1 --format '{{.Image}}' > "$backup/image-id.txt"
fi
tar -xzf /home/admin/malaikanest-size-first-20260914.tar.gz
docker compose -f docker-compose.lean.yml build web
docker compose -f docker-compose.lean.yml run --rm --no-deps -T web python - <<'PY'
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.prod')
import django
django.setup()
from django.conf import settings
from django.core.management import call_command
settings.SECURE_SSL_REDIRECT = False
settings.ALLOWED_HOSTS = list(settings.ALLOWED_HOSTS) + ['testserver']
call_command('test', 'apps.products.tests_admin_categories', 'apps.storefront.tests_sizing', 'apps.storefront.tests', 'apps.products.tests_shop_import', 'apps.storefront.tests_admin_theme', interactive=False, verbosity=0)
call_command('makemigrations', check=True, dry_run=True)
PY
echo 'TESTS_PASSED_READY_FOR_MIGRATION'
