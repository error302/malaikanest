from rest_framework.test import APITestCase

from apps.products.models import Category, Product


class ProductSlugLookupTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Bath & Baby Care")
        self.product = Product.objects.create(
            name="Softcare Baby Wipes",
            slug="softcare-baby-wipes",
            category=self.category,
            price="199.00",
            stock=12,
            status="published",
            is_active=True,
        )

    def test_product_detail_resolves_by_slug(self):
        response = self.client.get(
            f"/api/v1/products/products/{self.product.slug}/", format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["slug"], self.product.slug)

    def test_product_inventory_action_resolves_by_slug(self):
        response = self.client.get(
            f"/api/v1/products/products/{self.product.slug}/inventory/", format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["stock"], self.product.stock)
