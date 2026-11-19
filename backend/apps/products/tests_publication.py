from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.products.models import Category, Product


class PublicProductPublicationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.category = Category.objects.create(name="Baby Clothing")
        self.published = Product.objects.create(
            name="Published Romper",
            category=self.category,
            price="1500.00",
            stock=5,
            status="published",
            is_active=True,
        )
        self.draft = Product.objects.create(
            name="Unreleased Romper",
            category=self.category,
            price="1500.00",
            stock=5,
            status="draft",
            is_active=True,
        )

    def _slugs(self, response):
        data = response.data
        results = data["results"] if isinstance(data, dict) else data
        return [item["slug"] for item in results]

    def test_public_list_excludes_drafts(self):
        response = self.client.get("/api/v1/products/products/", format="json")
        self.assertEqual(response.status_code, 200)
        slugs = self._slugs(response)
        self.assertIn(self.published.slug, slugs)
        self.assertNotIn(self.draft.slug, slugs)

    def test_public_detail_hides_draft(self):
        response = self.client.get(
            f"/api/v1/products/products/{self.draft.slug}/", format="json"
        )
        self.assertEqual(response.status_code, 404)

    def test_public_detail_still_serves_published(self):
        response = self.client.get(
            f"/api/v1/products/products/{self.published.slug}/", format="json"
        )
        self.assertEqual(response.status_code, 200)
