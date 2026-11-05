"""
Seed the live catalogue from a CSV/JSON file.

Why this exists
---------------
The production database currently has ZERO products:

    GET https://api.malaikanest.com/api/v1/products/products/
    -> {"results": [], "meta": {"count": 0}}

and every category reports "product_count": 0. The storefront renders its empty
state ("New arrivals are being added"), so the shop cannot take an order at all.
Nothing else in this list matters until this is fixed.

The two existing seeders cannot do the job:

  * backend/apps/products/management/commands/seed_products.py
      hard-returns when ENVIRONMENT is production:
          if env in {"production", "prod", "live"}: return
      and it looks up categories by names like 'Newborn (0-3 Months)' /
      'Diapers' that do not exist in the live tree (which is 'Baby Clothing',
      'Baby Essentials', 'Clothing/Baby/Boys', ...). So even with the guard
      removed it would create 0 products.

  * seed_live_products.py (repo root) is a bare script, not a management
      command. It globs a hard-coded path from an old Oracle VM:
          image_files = sorted(glob.glob('/home/opc/malaikanest/product_images/*.jpeg'))
          img_path = image_files[idx % len(image_files)]
    On this host the glob is empty, so `idx % len(image_files)` raises
    ZeroDivisionError and NO product is ever created. It also writes to
    /code/media/products, which is not where Cloudinary-backed media lives.

This command is deliberately production-safe: it requires an explicit flag, it
is idempotent (keyed on slug), it never deletes, and it dry-runs by default.

Install
-------
Save as:  backend/apps/products/management/commands/seed_catalog.py

Usage
-----
    # 1. See exactly what would happen, change nothing
    python manage.py seed_catalog --file catalog.csv --dry-run

    # 2. Actually write (the --allow-production flag is mandatory in prod)
    python manage.py seed_catalog --file catalog.csv --allow-production

    # 3. On the VM
    ssh malaikanest-gcp "cd ~/malaikanest && docker compose -f docker-compose.lean.yml \
      exec -T web python manage.py seed_catalog --allow-production" < catalog.csv

CSV columns
-----------
Required: name, price, category, image_url
Optional: sku, compare_price, description, age_group, gender, size_label,
          featured, stock, status, seo_title, seo_description, brand,
          variants   (JSON list: [{"color":"pink","size":"0-3m","price_modifier":0,"quantity":5}])

`category` may be a slug ("baby-clothing") or a full path
("clothing/baby/girls/dresses"). `image_url` should be an absolute https URL
(Cloudinary or your own CDN) so it survives container rebuilds.

Constrained values (Django will reject anything else):
  age_group : baby | toddler | kids
  gender    : boy | girl | unisex
  status    : draft | published
  variant size  : newborn,0-3m,3-6m,6-12m,1y,2y,3y,4y,5y,6y,7y,8y,9y,10y,...
  variant color : white,black,gray,pink,blue,green,yellow,red,purple,orange,brown,beige,multi

Variants are unique on (product, size, color), so re-running is safe.
Leave size/color EMPTY (not "") to mean "unspecified" — the command converts
blank to NULL so it matches the rows Django already stores.

Then bust the product cache (the list view is cached for 300s):
    python manage.py shell -c "from django.core.cache import cache; cache.clear()"
"""

import csv
import io
import json
import sys
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.products.models import Brand, Category, Product, ProductVariant, VariantInventory


class Command(BaseCommand):
    help = "Seed or update the live catalogue from a CSV/JSON file (idempotent, dry-run by default)."

    def add_arguments(self, parser):
        parser.add_argument("--file", help="Path to a CSV or JSON catalog. Omit to read stdin.")
        parser.add_argument("--dry-run", action="store_true", help="Report what would change without writing.")
        parser.add_argument(
            "--allow-production",
            action="store_true",
            help="REQUIRED to write when ENVIRONMENT is production. Guards against accidental seeding.",
        )
        parser.add_argument(
            "--default-stock",
            type=int,
            default=0,
            help="Stock to assign when a row omits it (default 0 = shows out of stock).",
        )

    def handle(self, *args, **opts):
        import os

        env = (os.getenv("ENVIRONMENT") or "development").strip().lower()
        is_prod = env in {"production", "prod", "live"}
        dry = bool(opts["dry_run"]) or is_prod and not opts["allow_production"]

        if is_prod and not opts["allow_production"] and not opts["dry_run"]:
            self.stdout.write(
                self.style.WARNING(
                    "Production detected: running as DRY RUN. Re-run with --allow-production to write."
                )
            )

        rows = self._read_rows(opts["file"])
        if not rows:
            raise CommandError("No rows found in input.")

        self.stdout.write(f"Read {len(rows)} row(s). dry_run={dry}")

        created = updated = skipped = 0
        errors = []

        for lineno, row in enumerate(rows, start=1):
            try:
                outcome = self._upsert_product(row, opts["default_stock"], dry=dry)
            except Exception as exc:  # keep going; report every bad row at the end
                errors.append(f"row {lineno} ({row.get('name', '?')}): {exc}")
                skipped += 1
                continue
            if outcome == "created":
                created += 1
            elif outcome == "updated":
                updated += 1
            else:
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"created={created} updated={updated} skipped={skipped} dry_run={dry}"
            )
        )
        if errors:
            self.stdout.write(self.style.ERROR("Row errors:"))
            for e in errors:
                self.stdout.write(f"  - {e}")
        if not dry and (created or updated):
            self.stdout.write(
                "Reminder: the product list view is cached for 300s. Clear it with:\n"
                '  python manage.py shell -c "from django.core.cache import cache; cache.clear()"'
            )

    # ── input ────────────────────────────────────────────────────────────────
    def _read_rows(self, path):
        if path:
            with open(path, newline="", encoding="utf-8-sig") as fh:
                text = fh.read()
        else:
            text = sys.stdin.read()
        if not text.strip():
            return []
        text = text.lstrip("\ufeff")
        if text.lstrip().startswith(("[", "{")):
            data = json.loads(text)
            return data if isinstance(data, list) else [data]
        return [r for r in csv.DictReader(io.StringIO(text)) if any((v or "").strip() for v in r.values())]

    # ── helpers ──────────────────────────────────────────────────────────────
    def _resolve_category(self, value):
        if not value:
            raise CommandError("category is required")
        value = value.strip()
        if "/" in value:
            cat = None
            for part in [p for p in value.split("/") if p]:
                slug = slugify(part)
                qs = Category.objects.filter(slug=slug)
                cat = qs.filter(parent=cat).first() if cat else qs.filter(parent__isnull=True).first()
                if not cat:
                    raise CommandError(f"category path not found at '{part}' in '{value}'")
            return cat
        cat = Category.objects.filter(slug=slugify(value)).first() or Category.objects.filter(name__iexact=value).first()
        if not cat:
            raise CommandError(
                f"category '{value}' not found. Create it first, or pass a full path like 'clothing/baby/girls'."
            )
        return cat

    def _decimal(self, value, field, default=None):
        if value in (None, ""):
            return default
        try:
            return Decimal(str(value).replace(",", "").strip())
        except (InvalidOperation, ValueError):
            raise CommandError(f"{field}='{value}' is not a valid decimal")

    def _upsert_product(self, row, default_stock, dry=False):
        name = (row.get("name") or "").strip()
        if not name:
            raise CommandError("name is required")

        price = self._decimal(row.get("price"), "price")
        if price is None or price <= 0:
            raise CommandError("price is required and must be > 0")

        category = self._resolve_category(row.get("category"))
        image_url = (row.get("image_url") or row.get("image") or "").strip()

        slug = (row.get("slug") or "").strip() or slugify(name)[:300]
        stock_raw = row.get("stock")
        stock = int(stock_raw) if str(stock_raw or "").strip().isdigit() else default_stock
        status = (row.get("status") or "published").strip().lower()
        if status not in {"draft", "published"}:
            raise CommandError(f"status='{status}' invalid (draft|published)")

        # NOTE: the public ProductViewSet filters ONLY on is_active=True. It does
        # not filter status='published'. So status is cosmetic today — set
        # is_active=False if you truly want a row hidden.
        is_active = str(row.get("is_active", "true")).strip().lower() not in {"false", "0", "no"}

        age_group = (row.get("age_group") or "").strip()
        valid_age = {a for a, _ in Product.AGE_GROUP_CHOICES} | {""}
        if age_group not in valid_age:
            raise CommandError(f"age_group '{age_group}' invalid. Allowed: {', '.join(sorted(valid_age - {''}))}")

        gender = (row.get("gender") or "unisex").strip().lower()
        valid_gender = {g for g, _ in Product.GENDER_CHOICES}
        if gender not in valid_gender:
            raise CommandError(f"gender '{gender}' invalid. Allowed: {', '.join(sorted(valid_gender))}")

        brand = None
        if (row.get("brand") or "").strip():
            brand = Brand.objects.filter(name__iexact=row["brand"].strip()).first()

        defaults = {
            "name": name,
            "price": price,
            "compare_price": self._decimal(row.get("compare_price"), "compare_price"),
            "description": (row.get("description") or "").strip(),
            "category": category,
            "brand": brand,
            "age_group": (row.get("age_group") or "").strip(),
            "gender": (row.get("gender") or "unisex").strip().lower(),
            "size_label": (row.get("size_label") or "").strip(),
            "featured": str(row.get("featured", "")).strip().lower() in {"1", "true", "yes"},
            "status": status,
            "is_active": is_active,
            "stock": stock,
            "seo_title": (row.get("seo_title") or "").strip()[:70],
            "seo_description": (row.get("seo_description") or "").strip()[:160],
        }
        if (row.get("sku") or "").strip():
            defaults["sku"] = row["sku"].strip()[:100]
        if image_url:
            defaults["image"] = image_url

        existing = Product.objects.filter(slug=slug).first()
        if dry:
            self.stdout.write(f"  [{'UPDATE' if existing else 'CREATE'}] {name}  KES {price}  {category.full_slug if hasattr(category,'full_slug') else category.slug}  stock={stock}")
            return "updated" if existing else "created"

        with transaction.atomic():
            if existing:
                for field, value in defaults.items():
                    if value is None and field in {"compare_price", "brand"}:
                        continue
                    setattr(existing, field, value)
                existing.save()
                product = existing
                outcome = "updated"
            else:
                product = Product.objects.create(slug=slug, **defaults)
                outcome = "created"

            self._sync_variants(product, row, dry=False)
            self.stdout.write(f"  [{outcome.upper()}] {product.name} ({product.slug}) stock={product.stock}")

        return outcome

    def _sync_variants(self, product, row, dry=False):
        raw = (row.get("variants") or "").strip()
        if not raw:
            return
        try:
            variants = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise CommandError(f"variants is not valid JSON: {exc}")
        if not isinstance(variants, list):
            raise CommandError("variants must be a JSON list")

        for spec in variants:
            # Blank must become NULL, not "". Existing rows store NULL, and the
            # unique constraint is (product, size, color) — an "" would not match
            # a NULL row and get_or_create would insert a duplicate variant.
            color = (spec.get("color") or "").strip() or None
            size = (spec.get("size") or "").strip() or None
            if not (color or size):
                continue

            valid_colors = {c for c, _ in ProductVariant.COLOR_CHOICES}
            valid_sizes = {s for s, _ in ProductVariant.SIZE_CHOICES}
            if color and color not in valid_colors:
                raise CommandError(
                    f"variant color '{color}' invalid. Allowed: {', '.join(sorted(valid_colors))}"
                )
            if size and size not in valid_sizes:
                raise CommandError(
                    f"variant size '{size}' invalid. Allowed: {', '.join(sorted(valid_sizes))}"
                )

            modifier = Decimal(str(spec.get("price_modifier", 0) or 0))
            qty = int(spec.get("quantity", 0) or 0)
            if qty < 0:
                raise CommandError("variant quantity cannot be negative (PositiveIntegerField)")

            variant, _ = ProductVariant.objects.get_or_create(
                product=product,
                color=color,
                size=size,
                defaults={"price_modifier": modifier, "is_active": True},
            )
            if spec.get("sku"):
                variant.sku = str(spec["sku"])[:100]
                variant.save(update_fields=["sku", "updated_at"])

            inv, _ = VariantInventory.objects.get_or_create(variant=variant, defaults={"quantity": qty})
            if not dry and inv.quantity != qty:
                inv.quantity = qty
                inv.save(update_fields=["quantity", "updated_at"])

        # Keep Product.stock consistent with variant totals so the storefront and
        # the `in_stock` filter agree.
        from apps.products.models import sync_product_stock

        sync_product_stock(product)
