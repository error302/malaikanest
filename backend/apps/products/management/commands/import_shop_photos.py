"""Prepare genuine shop photos for merchant review. Never publish or overwrite."""
import hashlib
import json
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q

from apps.products.models import Category, Product, validate_image_file


class Command(BaseCommand):
    help = 'Validate shop photos; --apply imports inactive, zero-stock draft products.'

    def add_arguments(self, parser):
        parser.add_argument('folder')
        parser.add_argument('--manifest', help='JSON mapping filenames to name and provisional price')
        parser.add_argument('--apply', action='store_true')

    def handle(self, *args, **options):
        folder = Path(options['folder']).resolve()
        if not folder.is_dir():
            raise CommandError('Photo folder does not exist.')
        manifest = {}
        if options.get('manifest'):
            try:
                manifest = json.loads(Path(options['manifest']).read_text(encoding='utf-8-sig'))
                if not isinstance(manifest, dict):
                    raise ValueError('Manifest must map filenames to product details.')
                for name, details in manifest.items():
                    if '/' in name or '\\' in name or not isinstance(details, dict):
                        raise ValueError('Manifest filenames must be direct children of the photo folder.')
                    if not (folder / name).is_file():
                        raise ValueError(f'Missing photo: {name}')
            except (OSError, ValueError) as exc:
                raise CommandError(str(exc)) from exc

        rows = []
        seen = set()
        for path in sorted(folder.iterdir(), key=lambda p: p.name):
            if path.suffix.lower() not in {'.jpeg', '.jpg', '.png', '.webp'}:
                continue
            if path.is_symlink() or not path.is_file() or path.resolve().parent != folder:
                raise CommandError(f'Photo must be a regular file in the source folder: {path.name}')
            details = manifest.get(path.name, {})
            try:
                price = Decimal(str(details.get('price', '1000')))
                if not price.is_finite() or price <= 0 or price > Decimal('99999999.99') or price != price.quantize(Decimal('.01')):
                    raise ValueError('Price must be a positive amount with at most two decimals.')
                name = str(details.get('name', f'Shop photo — {path.stem}'))
                if not name.strip() or len(name) > 255:
                    raise ValueError('Name must contain 1–255 characters.')
                with path.open('rb') as stream:
                    validate_image_file(File(stream, name=path.name))
                digest = hashlib.sha256(path.read_bytes()).hexdigest()
            except Exception as exc:
                raise CommandError(f'Invalid photo or details for {path.name}: {exc}') from exc
            if digest in seen:
                continue
            seen.add(digest)
            rows.append((path, name, price, digest))
        if not rows:
            raise CommandError('No supported photos found.')
        self.stdout.write(f'Validated {len(rows)} photos. All prices require owner review.')
        if not options['apply']:
            self.stdout.write('No changes made. Use --apply to create unpublished drafts.')
            return

        category, _ = Category.objects.get_or_create(
            slug='shop-photo-review', parent=None, defaults={'name': 'Shop photo review'},
        )
        created = skipped = 0
        for path, name, price, digest in rows:
            sku = f'SHOPPHOTO-{digest}'
            if Product.objects.filter(Q(sku=sku) | Q(slug=f'shop-photo-{digest}') | Q(image__contains=f'shop-{digest}')).exists():
                skipped += 1
                continue
            # Per-photo transaction permits safe continuation after an interrupted upload.
            # A failed DB save may leave an unused media object, never an active product.
            with transaction.atomic():
                product = Product(
                    name=name, sku=sku, slug=f'shop-photo-{digest}', category=category,
                    price=price, status='draft', is_active=False, stock=0, featured=False,
                    description=(f'OWNER REVIEW REQUIRED. Source photo: {path.name}. '
                                 'Price is provisional, not an advertised offer. Confirm the name, '
                                 'category, price, sizes, condition, material, included pieces and '
                                 'available quantity before publishing. Photos may show the same '
                                 'item from different angles; merge those records before publishing.'),
                )
                with path.open('rb') as stream:
                    product.image.save(f'shop-{digest}{path.suffix.lower()}', File(stream), save=False)
                product.save()
            created += 1
            self.stdout.write(f'Created draft {created}: {path.name}')
        self.stdout.write(self.style.SUCCESS(f'Created {created} unpublished drafts; skipped {skipped} existing photos. Stock remains zero.'))
