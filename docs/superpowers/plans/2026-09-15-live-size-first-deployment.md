# Malaika Nest live size-first deployment handoff

> **For agentic workers:** Use the executing-plans workflow. Do not claim completion without fresh verification evidence.

## Goal

Deploy the approved category-label and white-and-blue size-first storefront changes to the live Malaika Nest VM without publishing draft products or losing catalog data.

## Live topology

- VM SSH alias: `malaikanest-gcp`
- Source: `/home/admin/malaikanest`
- Compose file: `docker-compose.lean.yml`
- Web container: `malaikanest-web-1`
- Database container: `malaikanest-db-1`
- Database: PostgreSQL database `malaika_production`, user `malaika_user`
- Storefront: https://malaikanest.com
- Django admin: https://malaikanest.com/manage-store/
- Never print environment files, SSH keys, Cloudflare credentials, or admin passwords.

## Release files

Package these exact current-checkout files, and no environment/media/credential files:

```
backend/apps/products/admin.py
backend/apps/products/models.py
backend/apps/products/migrations/0008_product_size_guide.py
backend/apps/products/tests_admin_categories.py
backend/apps/storefront/views.py
backend/apps/storefront/sizing.py
backend/apps/storefront/tests_sizing.py
backend/templates/storefront/blue_theme.html
backend/templates/storefront/base.html
backend/templates/storefront/product_list.html
backend/templates/storefront/product_detail.html
```

From `C:\Users\user\Desktop\malaikanest`:

```powershell
git diff --check
python -m compileall -q backend/apps/products backend/apps/storefront
tar -czf malaikanest-size-first-20260915.tar.gz backend/apps/products/admin.py backend/apps/products/models.py backend/apps/products/migrations/0008_product_size_guide.py backend/apps/products/tests_admin_categories.py backend/apps/storefront/views.py backend/apps/storefront/sizing.py backend/apps/storefront/tests_sizing.py backend/templates/storefront/blue_theme.html backend/templates/storefront/base.html backend/templates/storefront/product_list.html backend/templates/storefront/product_detail.html
tar -tzf malaikanest-size-first-20260915.tar.gz
scp -F C:/Users/user/.ssh/config malaikanest-size-first-20260915.tar.gz malaikanest-gcp:/home/admin/
```

If the archive contains `.env`, keys, `media/`, or an older archive, stop and recreate it.

## Backup before deployment

```powershell
ssh -F C:/Users/user/.ssh/config -o BatchMode=yes -o ConnectTimeout=12 malaikanest-gcp "hostname; cd /home/admin/malaikanest && docker compose -f docker-compose.lean.yml ps"
```

On the VM:

```bash
cd /home/admin/malaikanest
backup=/home/admin/malaikanest-backups/size-first-20260915
mkdir -p "$backup" && chmod 700 "$backup"
docker exec malaikanest-db-1 pg_dump -U malaika_user malaika_production | gzip > "$backup/before.sql.gz"
gzip -t "$backup/before.sql.gz"
tar -czf "$backup/source-before.tar.gz" backend/apps/products/admin.py backend/apps/products/models.py backend/apps/storefront/views.py backend/templates/storefront/base.html backend/templates/storefront/product_list.html backend/templates/storefront/product_detail.html
docker inspect malaikanest-web-1 --format '{{.Image}}' > "$backup/image-id.txt"
```

Abort if the dump is empty or `gzip -t` fails.

## Build and test

```bash
cd /home/admin/malaikanest
tar -xzf /home/admin/malaikanest-size-first-20260915.tar.gz
docker compose -f docker-compose.lean.yml build web
docker compose -f docker-compose.lean.yml run --rm --no-deps -T web python manage.py test apps.products.tests_admin_categories apps.storefront.tests_sizing apps.storefront.tests apps.products.tests_shop_import apps.storefront.tests_admin_theme --noinput --verbosity=1
docker compose -f docker-compose.lean.yml run --rm --no-deps -T web python manage.py makemigrations --check --dry-run
```

All tests must pass and makemigrations must report no model changes. Tests must use Django’s disposable test database, never `malaika_production`.

## Apply and restart

```bash
docker compose -f docker-compose.lean.yml run --rm --no-deps -T web python manage.py migrate products --noinput
docker compose -f docker-compose.lean.yml up -d --no-deps web
docker compose -f docker-compose.lean.yml ps
docker compose -f docker-compose.lean.yml logs --tail=120 web
```

Restart only `web`; preserve the database and Cloudflare tunnel containers.

## Verify live behavior

From the VM:

```bash
docker exec malaikanest-web-1 python -c "import urllib.request; r=urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8000/api/health/',headers={'Host':'api.malaikanest.com','X-Forwarded-Proto':'https'}),timeout=4); print(r.status, r.read().decode()[:200])"
```

In a real browser, verify HTTP 200 and rendering for:

- https://malaikanest.com/
- https://malaikanest.com/products/
- https://malaikanest.com/manage-store/products/product/?is_active__exact=0

Check that size buttons are visible, sold-out/inactive variants are excluded, pagination retains filters, and each product’s “Measurements & fit” uses only owner-entered text or asks for measurements. Confirm six Dresses records remain separate and admin labels show full paths such as `Clothing › Baby › Baby Girls › Dresses`. Confirm imported shop-photo drafts remain inactive, draft, and zero-stock.

## Diagnosis and rollback

- SSH banner timeout: inspect GCP VM console for CPU throttling; reset/restart only if authorized, then verify the alias and IP.
- SSH config permission denied: run upload from the user’s normal PowerShell terminal; never copy SSH keys into the repo.
- Docker build error: stop, capture the first error, and check archive contents/syntax. Do not change production secrets.
- Test database/table error: rerun the exact `docker compose run ... manage.py test` command; do not point tests at production.
- Migration error: stop before restart; inspect `showmigrations products`; do not fake or edit migration history.
- Repeated category labels: confirm the running image contains current `admin.py`, rebuild, and restart. Never rename/delete categories.
- Sold-out sizes shown: check `sizing.py`; active variants require inventory available greater than zero, and products with variants must not fall back to parent stock when all variants are inactive.
- 502/503 or non-200 health: inspect web and tunnel logs. If web is unhealthy, restore the previous image ID from `$backup/image-id.txt`; do not alter Cloudflare DNS or credentials.

## Required completion report

Return archive checksum, backup path, test count/result, migration result, web status, health response, URLs checked, and confirmation that drafts stayed inactive. If any gate fails, report the exact error and leave the live service untouched.

