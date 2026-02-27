from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from apps.products.models import Category, Product, Banner
import os
import cloudinary.uploader


class Command(BaseCommand):
    help = 'Bulk upload images from a local folder to Cloudinary and attach to Category/Product/Banner'

    def add_arguments(self, parser):
        parser.add_argument('folder', type=str, help='Local folder containing image files')
        parser.add_argument('--type', type=str, choices=['category', 'product', 'banner'], default='category', help='Which model to attach images to')
        parser.add_argument('--default-category', type=str, help='Category slug to use when creating products')
        parser.add_argument('--create-products', action='store_true', help='Create product entries when missing (for --type=product)')

    def handle(self, *args, **options):
        folder = options['folder']
        model_type = options['type']
        default_cat_slug = options.get('default_category')
        create_products = options.get('create_products')

        if not os.path.isdir(folder):
            raise CommandError(f'Folder not found: {folder}')

        files = [f for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f))]
        if not files:
            self.stdout.write(self.style.WARNING('No files found in folder'))
            return

        uploaded = 0
        errors = 0

        for fn in files:
            path = os.path.join(folder, fn)
            name, _ = os.path.splitext(fn)

            # For product filenames, allow slug__price.ext (double underscore)
            slug = name
            price = None
            if model_type == 'product' and '__' in name:
                parts = name.split('__')
                slug = parts[0]
                if len(parts) > 1:
                    try:
                        price = float(parts[1])
                    except Exception:
                        price = None

            try:
                res = cloudinary.uploader.upload(path, folder='malaika_nest')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Upload failed for {fn}: {e}'))
                errors += 1
                continue

            public_id = res.get('public_id') or res.get('asset_id') or res.get('secure_url')

            try:
                if model_type == 'category':
                    try:
                        cat = Category.objects.get(slug=slug)
                    except Category.DoesNotExist:
                        # try by name
                        cat = Category.objects.filter(name__iexact=slug.replace('-', ' ')).first()
                    if not cat:
                        self.stdout.write(self.style.WARNING(f'Category not found for slug/name: {slug}'))
                        errors += 1
                    else:
                        cat.image = public_id
                        cat.save()
                        uploaded += 1

                elif model_type == 'product':
                    prod = Product.objects.filter(slug=slug).first()
                    if not prod:
                        if create_products:
                            # require a category
                            cat = None
                            if default_cat_slug:
                                cat = Category.objects.filter(slug=default_cat_slug).first()
                            if not cat:
                                cat = Category.objects.first()
                            if not cat:
                                self.stdout.write(self.style.WARNING('No category available to create product'))
                                errors += 1
                                continue
                            prod = Product.objects.create(name=slug.replace('-', ' ').title(), slug=slug, category=cat, price=price or 0.0)
                        else:
                            self.stdout.write(self.style.WARNING(f'Product not found for slug: {slug}'))
                            errors += 1
                            continue
                    # update price if provided
                    if price is not None:
                        prod.price = price
                    prod.image = public_id
                    prod.save()
                    uploaded += 1

                elif model_type == 'banner':
                    title = name.replace('-', ' ').title()
                    Banner.objects.create(title=title, image=public_id, is_active=True)
                    uploaded += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed attaching {fn}: {e}'))
                errors += 1

        self.stdout.write(self.style.SUCCESS(f'Uploaded: {uploaded}, Errors: {errors}'))
