import sys
from pathlib import Path
from types import SimpleNamespace
from io import BytesIO

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from django.conf import settings

settings.configure(
    SECRET_KEY="isolated-admin-serializer-tests",
    INSTALLED_APPS=[
        "django.contrib.auth", "django.contrib.contenttypes", "apps.accounts",
        "apps.core", "apps.products", "apps.orders",
    ],
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    AUTH_USER_MODEL="accounts.User",
    DEFAULT_AUTO_FIELD="django.db.models.BigAutoField",
    USE_TZ=True,
    ALLOWED_HOSTS=["testserver"],
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
    STORAGES={"default": {"BACKEND": "django.core.files.storage.InMemoryStorage"}},
    MIGRATION_MODULES={key: None for key in ["auth", "contenttypes", "accounts", "core", "products", "orders"]},
)

import django

django.setup()

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.test.runner import DiscoverRunner
from django.utils.datastructures import MultiValueDict
from PIL import Image
from rest_framework import serializers
from apps.products.admin_serializers import AdminProductSerializer
from apps.products.models import Brand, Category, Inventory, Product, ProductImage, ProductVariant, VariantInventory


class AdminProductWorkflowTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Test clothing")
        self.brand = Brand.objects.create(name="Owner brand")
        self.product = Product.objects.create(
            name="Owner draft", category=self.category, brand=self.brand, price="500.00",
            sku="OWNER-SKU", age_group="baby", age_range="0-3 months", size_label="0-3m",
            size_guide="Owner measurements", fabric="Owner fabric", whats_included="Owner contents",
            is_active=False, status="draft",
        )
        Inventory.objects.create(product=self.product, quantity=0)

    def patch(self, data, files=None):
        request = SimpleNamespace(data=data, FILES=files or MultiValueDict())
        serializer = AdminProductSerializer(self.product, data=data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        saved = serializer.save()
        self.product.refresh_from_db()
        return saved

    def photo(self, name="photo.png"):
        content = BytesIO()
        Image.new("RGB", (2, 2), "blue").save(content, format="PNG")
        return SimpleUploadedFile(name, content.getvalue(), content_type="image/png")

    def variant(self, active=True, stock=3, reserved=0):
        row = ProductVariant.objects.create(product=self.product, color="blue", size="0-3m", sku="SIZE-SKU", is_active=active)
        VariantInventory.objects.create(variant=row, quantity=stock, reserved=reserved)
        return row

    def test_measurements_fabric_and_contents_persist_and_reload(self):
        self.patch({"size_guide": "Garment chest 54 cm", "fabric": "Cotton", "whats_included": "One dress"})
        self.assertEqual(self.product.size_guide, "Garment chest 54 cm")
        self.assertEqual(self.product.fabric, "Cotton")
        self.assertEqual(self.product.whats_included, "One dress")
        data = AdminProductSerializer(self.product).data
        self.assertEqual(data["size_guide"], "Garment chest 54 cm")
        self.assertEqual(data["fabric"], "Cotton")
        self.assertEqual(data["whats_included"], "One dress")

    def test_partial_save_preserves_omitted_owner_fields(self):
        self.patch({"name": "Updated draft"})
        self.assertEqual(self.product.brand_id, self.brand.id)
        self.assertEqual(self.product.sku, "OWNER-SKU")
        self.assertEqual(self.product.age_group, "baby")
        self.assertEqual(self.product.age_range, "0-3 months")
        self.assertEqual(self.product.size_label, "0-3m")
        self.assertEqual(self.product.size_guide, "Owner measurements")
        self.assertFalse(self.product.is_active)
        self.assertEqual(self.product.status, "draft")

    def test_owner_details_can_be_explicitly_cleared(self):
        self.patch({"size_guide": "", "fabric": "", "whats_included": ""})
        self.assertEqual((self.product.size_guide, self.product.fabric, self.product.whats_included), ("", "", ""))

    def test_inactive_sizes_remain_editable(self):
        row = self.variant(active=False)
        data = AdminProductSerializer(self.product).data
        self.assertEqual(len(data["variants"]), 1)
        self.assertEqual(data["variants"][0]["id"], row.id)
        self.assertFalse(data["variants"][0]["is_active"])

    def test_inventory_save_preserves_variant_sku_when_omitted(self):
        row = self.variant()
        self.patch({"variants": [{"id": str(row.id), "color": "blue", "size": "0-3m", "stock": 5, "is_active": True}]})
        row.refresh_from_db()
        self.assertEqual(row.sku, "SIZE-SKU")
        self.assertEqual(row.inventory.quantity, 5)
        self.assertEqual(self.product.stock, 5)

    def test_inventory_never_reports_saved_stock_below_reservations(self):
        row = self.variant(stock=5, reserved=2)
        saved = self.patch({"variants": [{"id": str(row.id), "color": "blue", "size": "0-3m", "stock": 0, "is_active": True}]})
        self.assertEqual(self.product.stock, 2)
        self.assertEqual(saved.stock, 2)
        self.assertEqual(VariantInventory.objects.get(variant=row).reserved, 2)

    def test_deactivating_last_size_does_not_leave_sellable_base_stock(self):
        row = self.variant()
        self.product.stock = 3
        self.product.save()
        Inventory.objects.filter(product=self.product).update(quantity=3)
        self.patch({"variants": [{"id": str(row.id), "color": "blue", "size": "0-3m", "stock": 3, "is_active": False}]})
        self.assertEqual(self.product.stock, 0)
        self.assertEqual(self.product.inventory.available(), 0)
        self.assertEqual(VariantInventory.objects.get(variant=row).quantity, 3)

    def test_gallery_upload_after_deletion_does_not_collide(self):
        ProductImage.objects.create(product=self.product, image="one.png", position=1)
        ProductImage.objects.create(product=self.product, image="two.png", position=2)
        self.patch({}, MultiValueDict({"gallery_images": [self.photo()]}))
        self.assertEqual(self.product.images.count(), 3)
        self.assertEqual(list(self.product.images.values_list("position", flat=True)), [1, 2, 3])
        self.assertEqual(self.product.sku, "OWNER-SKU")

    def test_primary_selection_updates_storefront_main_image(self):
        photo = ProductImage.objects.create(product=self.product, image="products/gallery/chosen.png", position=0)
        self.patch({"primary_image_id": str(photo.id)})
        self.assertEqual(self.product.image.name, "products/gallery/chosen.png")
        photo.refresh_from_db()
        self.assertTrue(photo.is_primary)

    def test_invalid_primary_selection_preserves_existing_main(self):
        photo = ProductImage.objects.create(product=self.product, image="chosen.png", position=0, is_primary=True)
        with self.assertRaises(serializers.ValidationError):
            self.patch({"primary_image_id": "00000000-0000-0000-0000-000000000001"})
        photo.refresh_from_db()
        self.assertTrue(photo.is_primary)

    def test_invalid_gallery_file_does_not_save_any_changes(self):
        with self.assertRaises((serializers.ValidationError, DjangoValidationError)) as raised:
            self.patch({"name": "Must not save"}, MultiValueDict({"gallery_images": [SimpleUploadedFile("bad.png", b"not an image")]}))
        self.assertIn("image", str(raised.exception).lower())
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "Owner draft")
        self.assertEqual(self.product.images.count(), 0)

    def test_deleting_primary_photo_clears_storefront_main(self):
        photo = ProductImage.objects.create(product=self.product, image="chosen.png", position=0, is_primary=True)
        Product.objects.filter(pk=self.product.pk).update(image="chosen.png")
        self.product.refresh_from_db()
        self.patch({"delete_image_ids": [str(photo.id)]})
        self.assertFalse(self.product.image)
        self.assertFalse(self.product.images.exists())

    def test_replacing_main_photo_clears_gallery_primary_flag(self):
        photo = ProductImage.objects.create(product=self.product, image="chosen.png", position=0, is_primary=True)
        self.patch({"image": self.photo()})
        photo.refresh_from_db()
        self.assertFalse(photo.is_primary)
        self.assertTrue(self.product.image)

    def test_main_upload_rejects_unsupported_extension(self):
        with self.assertRaises((serializers.ValidationError, DjangoValidationError)):
            self.patch({"image": self.photo("photo.gif")})

    def test_fractional_variant_stock_is_rejected_without_saving(self):
        with self.assertRaises(serializers.ValidationError):
            self.patch({"name": "Must not save", "variants": [{"color": "blue", "size": "2y", "stock": 1.5}]})
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "Owner draft")

    def test_multipart_false_does_not_activate_variant(self):
        row = self.variant()
        self.patch({"variants": '[{"id": "%s", "color": "blue", "size": "0-3m", "stock": "3", "is_active": "false"}]' % row.id})
        row.refresh_from_db()
        self.assertFalse(row.is_active)

    def test_empty_variant_list_deactivates_existing_rows(self):
        row = self.variant()
        self.patch({"variants": []})
        row.refresh_from_db()
        self.assertFalse(row.is_active)
        self.assertEqual(self.product.stock, 0)

    def test_invalid_variant_choices_and_duplicate_rows_are_rejected(self):
        for rows in (
            [{"color": "not-a-colour", "size": "2y", "stock": 1}],
            [{"color": "blue", "size": "not-a-size", "stock": 1}],
            [{"color": "blue", "stock": 1}, {"color": "blue", "stock": 2}],
            [{"id": "invalid", "color": "blue", "stock": 1}],
        ):
            with self.subTest(rows=rows), self.assertRaises(serializers.ValidationError):
                self.patch({"variants": rows})

    def test_gallery_reorder_preserves_unlisted_photos(self):
        first = ProductImage.objects.create(product=self.product, image="first.png", position=0)
        second = ProductImage.objects.create(product=self.product, image="second.png", position=1)
        self.patch({"image_orders": [str(second.id)]})
        self.assertEqual(list(self.product.images.values_list("id", flat=True)), [second.id, first.id])

    def test_publication_can_be_explicit_and_reversible(self):
        self.patch({"status": "published", "is_active": True})
        self.assertEqual((self.product.status, self.product.is_active), ("published", True))
        self.patch({"status": "draft", "is_active": False})
        self.assertEqual((self.product.status, self.product.is_active), ("draft", False))


if __name__ == "__main__":
    sys.exit(bool(DiscoverRunner(verbosity=2).run_tests(["__main__"])))
