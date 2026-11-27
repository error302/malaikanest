import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from django.conf import settings

settings.configure(
    SECRET_KEY="admin-api-workflow-tests",
    ROOT_URLCONF=__name__,
    INSTALLED_APPS=[
        "django.contrib.auth", "django.contrib.contenttypes", "django.contrib.sessions",
        "apps.accounts", "apps.core", "apps.products", "apps.orders",
    ],
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
    AUTH_USER_MODEL="accounts.User",
    DEFAULT_AUTO_FIELD="django.db.models.BigAutoField",
    USE_TZ=True,
    ALLOWED_HOSTS=["testserver"],
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
    STORAGES={"default": {"BACKEND": "django.core.files.storage.InMemoryStorage"}},
    MIGRATION_MODULES={key: None for key in ["auth", "contenttypes", "accounts", "core", "products", "orders"]},
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": [],
        "DEFAULT_RENDERER_CLASSES": ["apps.core.renderers.StandardJSONRenderer"],
        "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
    },
)

import django

django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.test.runner import DiscoverRunner
from django.utils.datastructures import MultiValueDict
from django.urls import include, path
from PIL import Image
from io import BytesIO
from apps.accounts.models import User
from apps.products.admin_views import AdminProductViewSet
from apps.products.models import Category, Product, ProductVariant
from rest_framework.test import APIClient

urlpatterns = [
    path("api/products/", include("apps.products.urls")),
]


class AdminProductApiTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="API clothing")
        self.staff = User.objects.create_superuser(email="staff2@example.com", phone_number="+254700000002", password="x")
        self.client = APIClient()
        self.client.force_authenticate(self.staff)

    def create_product(self, **kwargs):
        payload = {"name": "API draft", "slug": "api-draft", "category": str(self.category.id), "price": "500.00", "stock": 2, "is_active": False, "status": "draft"}
        payload.update(kwargs)
        response = self.client.post("/api/products/admin/products/", payload, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        return response.json()["data"]["id"]

    def test_catalogue_filters_roll_up_categories_and_match_age_without_stock(self):
        child = Category.objects.create(name="Dresses", parent=self.category)
        product_id = self.create_product(category=str(child.id), age_range="6-8 years",
                                         condition="mtumba", stock=0)
        self.create_product(slug="other-draft", age_range="1-2 years")
        product_list = "/api/products/admin/products/"
        response = self.client.get(product_list + "catalogue-options/")
        self.assertEqual(response.status_code, 200)
        self.assertIn({"value": "6-8y", "label": "6–8 years"}, response.json()["data"]["ages"])
        response = self.client.get(product_list, {
            "category_path": self.category.full_slug, "age": "6-8y", "condition": "mtumba",
        })
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual([row["id"] for row in response.json()["data"]["results"]], [product_id])
        self.assertEqual(response.json()["data"]["results"][0]["available_stock"], 0)

    def test_cover_file_replaces_a_previously_saved_image_url(self):
        product_id = self.create_product(image_url="https://example.test/old-cover.webp")
        photo = BytesIO()
        Image.new("RGB", (12, 12), "pink").save(photo, format="PNG")
        upload = SimpleUploadedFile("new-cover.png", photo.getvalue(), content_type="image/png")
        response = self.client.patch(
            f"/api/products/admin/products/{product_id}/", {"image": upload}, format="multipart",
        )
        self.assertEqual(response.status_code, 200, response.content)
        product = Product.objects.get(pk=product_id)
        self.assertFalse(product.image_url)
        self.assertTrue(product.image.name.endswith("new-cover.png"))
        self.assertTrue(response.json()["data"]["image_full_url"].endswith("new-cover.png"))

    def test_owner_data_survives_a_description_only_save(self):
        product_id = self.create_product(size_guide="Owner guide", fabric="Owner fabric", whats_included="Owner contents")
        response = self.client.patch(
            f"/api/products/admin/products/{product_id}/", {"description": "A dress"}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.content)
        refreshed = Product.objects.get(pk=product_id)
        self.assertEqual(refreshed.size_guide, "Owner guide")
        self.assertEqual(refreshed.fabric, "Owner fabric")
        self.assertEqual(refreshed.whats_included, "Owner contents")

    def test_a_text_only_save_does_not_touch_inventory(self):
        product_id = self.create_product(status="published", is_active=True)
        response = self.client.patch(
            f"/api/products/admin/products/{product_id}/", {"description": "A dress"}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.content)
        data = response.json()["data"]
        self.assertEqual(data["status"], "published")
        self.assertTrue(data["is_active"])
        self.assertEqual(data["stock"], 2)
        refreshed = Product.objects.get(pk=product_id)
        self.assertEqual(refreshed.inventory.quantity, 2)

    def test_publishing_flips_both_visibility_fields(self):
        product_id = self.create_product()
        response = self.client.patch(
            f"/api/products/admin/products/{product_id}/", {"status": "published", "is_active": True}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.content)
        refreshed = Product.objects.get(pk=product_id)
        self.assertEqual(refreshed.status, "published")
        self.assertTrue(refreshed.is_active)

    def test_variants_published_stocks_are_replaced_in_one_call(self):
        product_id = self.create_product()
        response = self.client.patch(
            f"/api/products/admin/products/{product_id}/",
            {"variants": [{"color": "blue", "size": "2y", "stock": 4, "is_active": True}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        data = response.json()["data"]
        self.assertEqual(data["stock"], 4)
        variant = ProductVariant.objects.get(product_id=product_id)
        self.assertEqual(variant.inventory.quantity, 4)
        self.assertEqual(variant.is_active, True)
        variant_id = data["variants"][0]["id"]
        response = self.client.patch(
            f"/api/products/admin/products/{product_id}/",
            {"variants": [{"id": variant_id, "color": "blue", "size": "2y", "stock": 7, "is_active": True}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["data"]["variants"][0]["stock"], 7)
        response = self.client.get(f"/api/products/admin/products/{product_id}/")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["data"]["stock"], 7)
        self.assertEqual(response.json()["data"]["variants"][0]["available_stock"], 7)
        response = self.client.patch(
            f"/api/products/admin/products/{product_id}/", {"variants": []}, format="json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["data"]["stock"], 0)
        self.assertFalse(response.json()["data"]["variants"][0]["is_active"])

    def test_multipart_gallery_upload_stores_file_and_sets_position(self):
        product_id = self.create_product()
        image = BytesIO()
        Image.new("RGB", (2, 2), "red").save(image, format="PNG")
        upload = SimpleUploadedFile("gallery.png", image.getvalue(), content_type="image/png")
        response = self.client.patch(
            f"/api/products/admin/products/{product_id}/", {"gallery_images": [upload]}, format="multipart"
        )
        self.assertEqual(response.status_code, 200, response.content)
        data = response.json()["data"]
        self.assertEqual(len(data["images"]), 1)
        self.assertTrue(data["images"][0]["url"].endswith(".png"))
        self.assertEqual(Product.objects.get(pk=product_id).images.get().position, 0)


if __name__ == "__main__":
    sys.exit(bool(DiscoverRunner(verbosity=2).run_tests(["__main__"])))
