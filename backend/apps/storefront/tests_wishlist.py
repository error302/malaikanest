from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from apps.products.models import Category, Product, Wishlist


class WishlistTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Rompers", slug="rompers")
        self.product = Product.objects.create(
            name="Cotton Romper",
            slug="cotton-romper",
            category=self.category,
            price=Decimal("1200.00"),
            is_active=True,
            status="published",
        )

    def test_guest_can_save_and_unsave(self):
        url = reverse("storefront:wishlist_toggle", kwargs={"slug": self.product.slug})

        response = self.client.post(url, HTTP_X_REQUESTED_WITH="fetch")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["saved"])
        self.assertEqual(response.json()["count"], 1)

        response = self.client.post(url, HTTP_X_REQUESTED_WITH="fetch")
        self.assertFalse(response.json()["saved"])
        self.assertEqual(response.json()["count"], 0)

    def test_saved_page_lists_saved_product(self):
        self.client.post(
            reverse("storefront:wishlist_toggle", kwargs={"slug": self.product.slug}),
            HTTP_X_REQUESTED_WITH="fetch",
        )
        response = self.client.get(reverse("storefront:wishlist"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Cotton Romper")

    def test_empty_saved_page_renders(self):
        response = self.client.get(reverse("storefront:wishlist"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Nothing saved yet")

    def test_header_heart_replaces_track_order(self):
        response = self.client.get(reverse("storefront:home"))
        self.assertContains(response, "shop-header-saved")
        self.assertNotContains(response, "shop-header-track")

    def test_inactive_product_cannot_be_saved(self):
        self.product.is_active = False
        self.product.save(update_fields=["is_active"])
        response = self.client.post(
            reverse("storefront:wishlist_toggle", kwargs={"slug": self.product.slug}),
            HTTP_X_REQUESTED_WITH="fetch",
        )
        self.assertEqual(response.status_code, 404)
