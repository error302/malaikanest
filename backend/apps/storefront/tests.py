from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from apps.products.models import Category, Product, ProductVariant, Inventory


class StorefrontCatalogueViewsTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="Baby Clothing",
            slug="baby-clothing",
        )
        self.active_product = Product.objects.create(
            name="Organic Cotton Romper",
            slug="organic-cotton-romper",
            price=Decimal("1800.00"),
            stock=15,
            category=self.category,
            is_active=True,
            age_group="0-3m",
            description="Super soft organic cotton baby romper.",
        )
        Inventory.objects.create(product=self.active_product, quantity=15)

        self.inactive_product = Product.objects.create(
            name="Discontinued Shoes",
            slug="discontinued-shoes",
            price=Decimal("2200.00"),
            stock=0,
            category=self.category,
            is_active=False,
            description="Inactive item.",
        )

        self.variant = ProductVariant.objects.create(
            product=self.active_product,
            size="0-3m",
            color="green",
            price_modifier=Decimal("0.00"),
        )

    def test_homepage_renders_active_categories_and_products(self):
        """Homepage returns 200, contains active categories and products, and excludes inactive ones."""
        response = self.client.get(reverse("storefront:home"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Organic Cotton Romper")
        self.assertContains(response, "Baby Clothing")
        self.assertNotContains(response, "Discontinued Shoes")

    def test_product_list_renders_products_and_filters(self):
        """Catalogue page lists active products and supports category filter."""
        # Unfiltered
        response = self.client.get(reverse("storefront:product_list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Organic Cotton Romper")
        self.assertNotContains(response, "Discontinued Shoes")

        # Filter by category
        response_cat = self.client.get(
            reverse("storefront:product_list") + "?category=baby-clothing"
        )
        self.assertEqual(response_cat.status_code, 200)
        self.assertContains(response_cat, "Organic Cotton Romper")

        # Filter by search
        response_search = self.client.get(
            reverse("storefront:product_list") + "?q=Organic"
        )
        self.assertEqual(response_search.status_code, 200)
        self.assertContains(response_search, "Organic Cotton Romper")

    def test_product_detail_renders_active_product(self):
        """Product detail page returns 200 and shows product information and variants."""
        response = self.client.get(
            reverse("storefront:product_detail", kwargs={"slug": "organic-cotton-romper"})
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Organic Cotton Romper")
        self.assertContains(response, "1800")
        self.assertContains(response, "green")
        self.assertContains(response, "0-3m")

    def test_product_detail_returns_404_for_missing_or_inactive(self):
        """Product detail returns 404 for missing or inactive products."""
        # Missing
        resp_missing = self.client.get(
            reverse("storefront:product_detail", kwargs={"slug": "non-existent-product"})
        )
        self.assertEqual(resp_missing.status_code, 404)

        # Inactive
        resp_inactive = self.client.get(
            reverse("storefront:product_detail", kwargs={"slug": "discontinued-shoes"})
        )
        self.assertEqual(resp_inactive.status_code, 404)
