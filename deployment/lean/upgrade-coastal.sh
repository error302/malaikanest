#!/usr/bin/env bash
set -euo pipefail
cd /home/admin/malaikanest
release=/home/admin/malaikanest-coastal-20260914
backup=/home/admin/malaikanest-backups/coastal-20260914
mkdir -p "$release" "$backup"
chmod 700 "$backup"
tar -xzf /home/admin/malaikanest-coastal-20260914.tar.gz -C "$release"
if [ ! -f "$backup/before.sql.gz" ]; then
  docker exec malaikanest-db-1 pg_dump -U malaika_user malaika_production | gzip > "$backup/before.sql.gz"
  gzip -t "$backup/before.sql.gz"
  tar -czf "$backup/source.tar.gz" backend/templates backend/apps/products/admin.py backend/apps/storefront/views.py backend/apps/storefront/context_processors.py
  docker inspect malaikanest-web-1 --format '{{.Image}}' > "$backup/image-id.txt"
fi
# Apply only the explicitly staged source files. Never touch env files/models.
cp -a "$release/backend/." backend/
docker compose -f docker-compose.lean.yml build web
docker compose -f docker-compose.lean.yml run --rm --no-deps -T web python manage.py test apps.storefront.tests_admin_theme apps.products.tests_shop_import --noinput --verbosity=1
docker compose -f docker-compose.lean.yml up -d --no-deps web
