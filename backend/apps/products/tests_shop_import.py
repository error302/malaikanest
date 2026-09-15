import io
import json
import tempfile
from decimal import Decimal
from pathlib import Path

from PIL import Image
from django.core.management import call_command, CommandError
from django.test import SimpleTestCase, TestCase, override_settings

from apps.products.models import Product


class PhotoInputTests(SimpleTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        Image.new('RGB', (12, 12), 'white').save(self.folder / 'dress.jpeg')

    def test_dry_run_validates_images_without_database_or_uploads(self):
        out = io.StringIO()
        call_command('import_shop_photos', str(self.folder), stdout=out)
        self.assertIn('Validated 1 photos', out.getvalue())
        self.assertIn('No changes made', out.getvalue())

    def test_corrupt_image_is_rejected_before_any_writes(self):
        (self.folder / 'bad.jpeg').write_bytes(b'not a photograph')
        with self.assertRaises(CommandError):
            call_command('import_shop_photos', str(self.folder))

    def test_invalid_price_is_rejected_before_any_writes(self):
        manifest = self.folder / 'manifest.json'
        manifest.write_text(json.dumps({'dress.jpeg': {'price': '-1'}}))
        with self.assertRaises(CommandError):
            call_command('import_shop_photos', str(self.folder), manifest=str(manifest))

    def test_manifest_cannot_reference_files_outside_folder(self):
        manifest = self.folder / 'manifest.json'
        manifest.write_text(json.dumps({'../private.jpeg': {'price': '1'}}))
        with self.assertRaises(CommandError):
            call_command('import_shop_photos', str(self.folder), manifest=str(manifest))


class PhotoImportTests(TestCase):
    def test_import_is_unpublished_and_repeat_preserves_owner_edits(self):
        with tempfile.TemporaryDirectory() as folder, tempfile.TemporaryDirectory() as media:
            Image.new('RGB', (12, 12), 'white').save(Path(folder) / 'dress.jpeg')
            with override_settings(MEDIA_ROOT=media, STORAGES={
                'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
                'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
            }):
                call_command('import_shop_photos', folder, apply=True, stdout=io.StringIO())
                product = Product.objects.get()
                self.assertFalse(product.is_active)
                self.assertEqual(product.status, 'draft')
                self.assertEqual(product.stock, 0)
                self.assertEqual(product.price, Decimal('1000'))
                self.assertTrue(product.image.storage.exists(product.image.name))
                product.name = 'Owner reviewed dress'
                product.sku = 'MY-SHOP-DRESS'
                product.price = Decimal('1850')
                product.save()
                call_command('import_shop_photos', folder, apply=True, stdout=io.StringIO())
                product.refresh_from_db()
                self.assertEqual(Product.objects.count(), 1)
                self.assertEqual(product.name, 'Owner reviewed dress')
                self.assertEqual(product.sku, 'MY-SHOP-DRESS')
                self.assertEqual(product.price, Decimal('1850'))
