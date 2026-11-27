from decimal import Decimal
from io import StringIO

from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse

from apps.core.models import SiteSettings
from apps.accounts.models import User
from apps.products.models import Banner, Category, Product, ProductImage, ProductVariant, Inventory


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=['testserver'])
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
            status="published",
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
            status="published",
            description="Inactive item.",
        )

        self.variant = ProductVariant.objects.create(
            product=self.active_product,
            size="0-3m",
            color="green",
            price_modifier=Decimal("0.00"),
        )

    def test_homepage_excludes_featured_drafts(self):
        draft = Product.objects.create(
            name="Unreleased Outfit", category=self.category, price="900.00",
            is_active=True, featured=True,
        )
        self.active_product.featured = True
        self.active_product.save(update_fields=["featured"])
        response = self.client.get(reverse("storefront:home"))
        self.assertEqual(list(response.context["featured_products"]), [self.active_product])
        self.assertEqual(list(response.context["new_arrivals"]), [self.active_product])
        self.assertNotContains(response, draft.name)
        draft.refresh_from_db()
        self.assertEqual(draft.status, "draft")

    def test_homepage_fallback_excludes_drafts(self):
        draft = Product.objects.create(
            name="Unreleased Outfit", category=self.category, price="900.00", is_active=True,
        )
        response = self.client.get(reverse("storefront:home"))
        self.assertEqual(list(response.context["featured_products"]), [self.active_product])
        self.assertEqual(list(response.context["new_arrivals"]), [self.active_product])
        self.assertNotContains(response, draft.name)

    def test_homepage_serves_phone_and_desktop_banner_photos(self):
        Banner.objects.create(
            title="New clothes in the shop",
            image_url="https://example.com/desktop.webp",
            mobile_image_url="https://example.com/mobile.webp",
        )
        response = self.client.get(reverse("storefront:home"))
        self.assertContains(response, '<source media="(max-width: 640px)" srcset="https://example.com/mobile.webp">', html=True)
        self.assertContains(response, 'src="https://example.com/desktop.webp"')

    def test_storefront_displays_the_original_logo_until_a_custom_logo_is_set(self):
        path = reverse("storefront:home")
        self.assertContains(self.client.get(path), "nest-home/original-malaika-logo.webp")

        settings = SiteSettings.get_solo()
        settings.logo_url = "https://example.com/shop-logo.webp"
        settings.save(update_fields=["logo_url"])
        response = self.client.get(path)
        self.assertContains(response, 'src="https://example.com/shop-logo.webp"')
        self.assertNotContains(response, "nest-home/original-malaika-logo.webp")

    def test_demo_cleanup_only_hides_original_seed_and_keeps_records(self):
        mock = Product.objects.create(
            name="Organic Ribbed Sleepsuit", slug="organic-ribbed-sleepsuit",
            category=self.category, price="900.00", is_active=True, status="published",
            image_url="https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=800&q=80",
        )
        replacement = Product.objects.create(
            name="Newborn Welcome Gift Hamper", slug="newborn-welcome-gift-hamper",
            category=self.category, price="900.00", is_active=True, status="published",
            image_url="https://example.com/my-own-photo.webp",
        )
        call_command("unpublish_demo_products", stdout=StringIO())
        mock.refresh_from_db()
        self.assertTrue(mock.is_active)

        call_command("unpublish_demo_products", "--apply", stdout=StringIO())
        mock.refresh_from_db()
        replacement.refresh_from_db()
        self.assertFalse(mock.is_active)
        self.assertEqual(mock.status, "draft")
        self.assertTrue(replacement.is_active)
        self.assertEqual(self.client.get(reverse("storefront:product_detail", args=[mock.slug])).status_code, 404)

    def test_catalogue_and_search_exclude_drafts(self):
        draft = Product.objects.create(
            name="Unreleased Outfit", category=self.category, price="900.00", is_active=True,
        )
        for params in ({}, {"category": self.category.slug}, {"q": "Unreleased"}):
            with self.subTest(params=params):
                response = self.client.get(reverse("storefront:product_list"), params)
                self.assertEqual(response.status_code, 200)
                self.assertNotIn(draft, response.context["products"])
                self.assertNotContains(response, draft.name)

    def test_product_detail_rejects_active_draft(self):
        self.active_product.status = "draft"
        self.active_product.save(update_fields=["status"])
        response = self.client.get(reverse("storefront:product_detail", args=[self.active_product.slug]))
        self.assertEqual(response.status_code, 404)
        self.active_product.refresh_from_db()
        self.assertEqual(self.active_product.status, "draft")

    def test_related_products_require_active_and_published(self):
        draft = Product.objects.create(
            name="Unreleased Outfit", category=self.category, price="900.00", is_active=True,
        )
        related = Product.objects.create(
            name="Published Outfit", category=self.category, price="900.00",
            is_active=True, status="published",
        )
        response = self.client.get(reverse("storefront:product_detail", args=[self.active_product.slug]))
        self.assertEqual(list(response.context["related_products"]), [related])
        self.assertNotContains(response, draft.name)
        self.assertNotContains(response, self.inactive_product.name)

    def test_homepage_renders_active_categories_and_products(self):
        """Homepage returns 200, contains active categories and products, and excludes inactive ones."""
        response = self.client.get(reverse("storefront:home"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Organic Cotton Romper")
        self.assertContains(response, "Baby Clothing")
        self.assertNotContains(response, "Discontinued Shoes")

    def test_manager_and_homepage_share_category_images_and_roots(self):
        legacy = "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=88"
        category = Category.objects.create(name="Clothing", slug="clothing", image_url=legacy, image="categories/old-crop.webp")
        Category.objects.create(name="Dresses", parent=category)
        Category.objects.create(name="Shop photo review")
        homepage = self.client.get(reverse("storefront:home"))
        self.assertContains(homepage, "/nest-home/categories/clothing.webp")
        self.assertNotContains(homepage, "Shop photo review")
        self.assertNotContains(homepage, legacy)
        staff = User.objects.create_superuser(email="categories@example.test", phone_number="+254700002036", password="OnlyForTests")
        self.client.force_login(staff)
        response = self.client.get("/api/products/admin/categories/")
        self.assertEqual(response.status_code, 200)
        rows = response.json()["data"]
        self.assertEqual(
            {row["slug"] for row in rows if row["is_storefront_root"]},
            {item.slug for item in homepage.context["categories"]},
        )
        clothing = next(row for row in rows if row["slug"] == "clothing")
        self.assertTrue(clothing["image_full_url"].endswith("/nest-home/categories/clothing.webp"))
        self.assertFalse(clothing["image_url"])
        self.assertIsNone(clothing["image"])
        self.client.patch(
            f"/api/products/admin/categories/{category.pk}/",
            {"description": "Clothes for babies and children"},
            content_type="application/json",
        )
        self.assertContains(self.client.get(reverse("storefront:home")), "/nest-home/categories/clothing.webp")
        Category.objects.filter(pk=category.pk).update(image_url="https://example.test/clothing.webp")
        self.assertContains(self.client.get(reverse("storefront:home")), "https://example.test/clothing.webp")

    def test_shared_product_card_uses_primary_gallery_url(self):
        ProductImage.objects.create(product=self.active_product, position=0, image_url="https://example.test/detail.webp")
        ProductImage.objects.create(product=self.active_product, position=1, is_primary=True, image_url="https://example.test/front.webp")
        for route in ("storefront:home", "storefront:product_list"):
            with self.subTest(route=route):
                response = self.client.get(reverse(route))
                self.assertContains(response, "https://example.test/front.webp")
                self.assertNotContains(response, "https://example.test/detail.webp")
                self.assertContains(response, f"Save {self.active_product.name} for later")

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
        self.assertContains(response, "Green")
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
