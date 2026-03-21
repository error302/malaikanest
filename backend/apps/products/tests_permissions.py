from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.products.models import Category


User = get_user_model()


class ProductPermissionBoundaryTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email="buyer@example.com",
            phone_number="+254711000111",
            password="BuyerPass123!",
        )
        self.admin = User.objects.create_superuser(
            email="staff@example.com",
            phone_number="+254711000222",
            password="StaffPass123!",
        )

    def test_anonymous_user_cannot_create_category(self):
        response = self.client.post("/api/products/categories/", {"name": "New Cat"}, format="json")
        self.assertIn(response.status_code, [401, 403])

    def test_authenticated_non_admin_cannot_create_category(self):
        self.client.force_authenticate(self.customer)
        response = self.client.post("/api/products/categories/", {"name": "Another Cat"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_admin_can_create_category(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/products/categories/", {"name": "Admin Cat"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Category.objects.filter(name="Admin Cat").exists())

    def test_anonymous_user_cannot_access_admin_products_endpoint(self):
        response = self.client.get("/api/products/admin/products/", format="json")
        self.assertIn(response.status_code, [401, 403])
