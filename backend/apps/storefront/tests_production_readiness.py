import io
from decimal import Decimal
from unittest.mock import MagicMock, patch
from PIL import Image

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase
from django.urls import reverse
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.authentication import CookieJWTAuthentication
from apps.core.models import OutboxEvent, SiteSettings
from apps.core.tasks import _dispatch_outbox_event
from apps.core.utils import is_safe_external_url
from apps.orders.models import Cart, CartItem, Order
from apps.orders.services import OrderService
from apps.payments.models import Payment
from apps.payments.paypal import PayPalService
from apps.products.models import Category, Inventory, Product, ProductVariant, VariantInventory

User = get_user_model()


class ProductionReadinessHardeningTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()
        self.user = User.objects.create_user(
            email="shopper@example.com",
            phone_number="+254712345678",
            password="SecurePassword123!",
            role=User.ROLE_CUSTOMER,
        )
        self.staff_user = User.objects.create_superuser(
            email="admin@example.com",
            phone_number="+254799999999",
            password="AdminPassword123!",
        )

        self.root_cat = Category.objects.create(name="Kids", slug="kids")
        self.sub_cat = Category.objects.create(name="Dresses", slug="dresses", parent=self.root_cat)

        self.product = Product.objects.create(
            name="Floral Summer Dress",
            slug="floral-summer-dress",
            category=self.sub_cat,
            price=Decimal("1500.00"),
            stock=10,
            status="published",
            is_active=True,
            size_label="1y",
        )
        self.inventory = Inventory.objects.create(product=self.product, quantity=10, reserved=0)

        self.order = Order.objects.create(
            user=self.user,
            total=Decimal("1500.00"),
            status="pending",
            delivery_region="nairobi",
            shipping_phone="0712345678",
            guest_email="shopper@example.com",
        )
        self.payment = Payment.objects.create(
            order=self.order,
            amount=Decimal("1500.00"),
            payment_method="paypal",
            status="initiated",
        )

    # -------------------------------------------------------------------------
    # G01: PayPal Return Secret Leak & Session Authorization
    # -------------------------------------------------------------------------
    def test_g01_anonymous_cannot_leak_order_secret_via_paypal_return(self):
        """
        An unauthenticated caller probing /checkout/paypal/return/ with an order's
        receipt number must NOT receive the order's secret checkout_token or access.
        """
        return_url = reverse("storefront:paypal_return")
        resp = self.client.get(f"{return_url}?receipt={self.order.receipt_number}&token=fake_paypal_order")

        # Must redirect away (to home) without checkout_token in redirect location
        self.assertEqual(resp.status_code, 302)
        self.assertNotIn(self.order.checkout_token, resp.url)
        self.assertIn("/", resp.url)

    def test_g01_authenticated_owner_can_complete_paypal_return(self):
        """Authenticated owner can access return and order is updated without token in URL."""
        self.client.force_login(self.user)
        return_url = reverse("storefront:paypal_return")

        mock_capture_resp = MagicMock(
            ok=True,
            json=lambda: {
                "status": "COMPLETED",
                "purchase_units": [
                    {
                        "custom_id": f"MALAIKA_{self.order.id}",
                        "payments": {"captures": [{"id": "CAPTURE-12345"}]},
                    }
                ],
            },
        )

        with patch("requests.post", return_value=mock_capture_resp), \
             patch.object(PayPalService, "get_access_token", return_value="mock_token"):
            resp = self.client.get(f"{return_url}?receipt={self.order.receipt_number}&token=CAPTURE-12345")
            self.assertEqual(resp.status_code, 302)
            # URL must NOT have the checkout_token query parameter
            self.assertNotIn("?token=", resp.url)

    # -------------------------------------------------------------------------
    # G02: PayPal Provider Binding and Outbox Signature
    # -------------------------------------------------------------------------
    def test_g02_paypal_capture_validates_order_binding_and_publishes_outbox(self):
        """PayPal capture binds custom_id and calls publish_event with correct signature."""
        mock_resp = MagicMock(
            ok=True,
            json=lambda: {
                "status": "COMPLETED",
                "purchase_units": [
                    {
                        "custom_id": f"MALAIKA_{self.order.id}",
                        "payments": {"captures": [{"id": "PAYPAL-TX-999"}]},
                    }
                ],
            },
        )
        service = PayPalService()
        with patch.object(service, "get_access_token", return_value="mock_token"), \
             patch("requests.post", return_value=mock_resp):
            res = service.capture_order("PAYPAL-TX-999", self.payment)
            self.assertEqual(res["status"], "completed")

        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.payment.status, "completed")
        self.assertEqual(self.order.status, "paid")

        # Verify outbox event was created without TypeError
        event = OutboxEvent.objects.filter(aggregate_id=str(self.order.id), event_type="order.paid").first()
        self.assertIsNotNone(event)
        self.assertEqual(event.aggregate_type, "order")

    def test_g02_paypal_mismatched_custom_id_is_rejected(self):
        """A capture response belonging to another store order must be rejected."""
        mock_resp = MagicMock(
            ok=True,
            json=lambda: {
                "status": "COMPLETED",
                "purchase_units": [
                    {
                        "custom_id": "MALAIKA_999999",  # mismatched order id
                        "payments": {"captures": [{"id": "PAYPAL-TX-999"}]},
                    }
                ],
            },
        )
        service = PayPalService()
        with patch.object(service, "get_access_token", return_value="mock_token"), \
             patch("requests.post", return_value=mock_resp):
            with self.assertRaises(ValueError):
                service.capture_order("PAYPAL-TX-999", self.payment)

    # -------------------------------------------------------------------------
    # G03: Background Processing & Outbox Task Fallback
    # -------------------------------------------------------------------------
    def test_g03_outbox_dispatch_succeeds_without_celery_broker(self):
        """Outbox dispatch must execute synchronously without crashing when Celery is absent."""
        event = OutboxEvent.objects.create(
            aggregate_type="order",
            aggregate_id=str(self.order.id),
            event_type="order.cancelled",
            payload={"order_id": str(self.order.id)},
        )
        # Verify running _dispatch_outbox_event does not throw
        _dispatch_outbox_event(event)

    # -------------------------------------------------------------------------
    # G05: Admin Cookie JWT CSRF and Token Version Revocation
    # -------------------------------------------------------------------------
    def test_g05_cookie_jwt_enforces_csrf_on_mutating_requests(self):
        """Mutating requests with cookie JWT but missing CSRF must be rejected."""
        refresh = RefreshToken.for_user(self.staff_user)
        access_token = str(refresh.access_token)

        from django.test.client import RequestFactory
        factory = RequestFactory()
        request = factory.post("/api/products/admin/products/")
        request.COOKIES = {"access_token": access_token}

        authenticator = CookieJWTAuthentication()
        with self.assertRaises(PermissionDenied):
            authenticator.authenticate(request)

    def test_g05_cookie_jwt_rejects_revoked_token_version(self):
        """Bumping user.token_version must reject previously issued access tokens."""
        refresh = RefreshToken.for_user(self.staff_user)
        access_token = str(refresh.access_token)

        # Bump user token_version (simulating password change or logout-everywhere)
        self.staff_user.token_version += 1
        self.staff_user.save(update_fields=["token_version"])

        from django.test.client import RequestFactory
        factory = RequestFactory()
        request = factory.get("/api/products/admin/products/", HTTP_AUTHORIZATION=f"Bearer {access_token}")
        request.COOKIES = {}

        authenticator = CookieJWTAuthentication()
        from rest_framework_simplejwt.exceptions import InvalidToken
        with self.assertRaises(InvalidToken):
            authenticator.authenticate(request)

    # -------------------------------------------------------------------------
    # G06: Checkout Revalidates Publication & Variant Flags
    # -------------------------------------------------------------------------
    def test_g06_checkout_rejects_unpublished_or_inactive_products(self):
        """Items added to cart that are subsequently unpublished must fail checkout."""
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1, unit_price=self.product.price)

        # Unpublish product
        self.product.status = "draft"
        self.product.save(update_fields=["status"])

        with self.assertRaises(ValueError) as ctx:
            OrderService.process_checkout(cart=cart, user=self.user, shipping_phone="0712345678", shipping_name="Test")
        self.assertIn("no longer available", str(ctx.exception))

    def test_g06_checkout_rejects_inactive_variant(self):
        """Inactive variants must fail checkout."""
        variant = ProductVariant.objects.create(
            product=self.product,
            color="yellow",
            size="1y",
            is_active=False,  # Inactive
        )
        VariantInventory.objects.create(variant=variant, quantity=5, reserved=0)

        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, variant=variant, quantity=1, unit_price=self.product.price)

        with self.assertRaises(ValueError) as ctx:
            OrderService.process_checkout(cart=cart, user=self.user, shipping_phone="0712345678", shipping_name="Test")
        self.assertIn("no longer available", str(ctx.exception))

    # -------------------------------------------------------------------------
    # G07: SSRF Protection on Remote Image URL Fetch
    # -------------------------------------------------------------------------
    def test_g07_ssrf_protection_blocks_internal_and_metadata_destinations(self):
        """is_safe_external_url must reject localhost, cloud metadata, and private IPs."""
        self.assertFalse(is_safe_external_url("http://127.0.0.1/evil.jpg"))
        self.assertFalse(is_safe_external_url("http://localhost:8000/evil.jpg"))
        self.assertFalse(is_safe_external_url("http://169.254.169.254/computeMetadata/v1/"))
        self.assertFalse(is_safe_external_url("http://metadata.google.internal/"))
        self.assertFalse(is_safe_external_url("http://10.0.0.1/private.png"))
        self.assertFalse(is_safe_external_url("http://192.168.1.1/router.png"))
        self.assertFalse(is_safe_external_url("file:///etc/passwd"))

    # -------------------------------------------------------------------------
    # G09: Category Resolution by Hierarchical Path
    # -------------------------------------------------------------------------
    def test_g09_category_resolves_hierarchical_paths_unambiguously(self):
        """Categories with the same slug under different parents resolve cleanly."""
        baby_root = Category.objects.create(name="Baby", slug="baby")
        baby_dresses = Category.objects.create(name="Dresses", slug="dresses", parent=baby_root)

        # Resolving full path "baby/dresses"
        resolved_baby = Category.resolve_by_path("baby/dresses")
        self.assertEqual(resolved_baby.pk, baby_dresses.pk)

        # Resolving full path "kids/dresses"
        resolved_kids = Category.resolve_by_path("kids/dresses")
        self.assertEqual(resolved_kids.pk, self.sub_cat.pk)

    # -------------------------------------------------------------------------
    # G12: Single Authoritative Free Shipping Threshold
    # -------------------------------------------------------------------------
    def test_g12_authoritative_free_shipping_threshold_controls_checkout(self):
        """Changing SiteSettings free_shipping_threshold dynamically changes checkout delivery fee."""
        settings_obj = SiteSettings.get_solo()
        settings_obj.free_shipping_threshold = Decimal("1400.00")
        settings_obj.save()

        # Product is KES 1500, which is >= 1400 threshold -> Free delivery
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1, unit_price=self.product.price)

        order = OrderService.process_checkout(
            cart=cart,
            user=self.user,
            shipping_phone="0712345678",
            shipping_name="Jane Doe",
            delivery_region="nairobi",
        )
        self.assertEqual(order.delivery_fee, Decimal("0.00"))
        self.assertEqual(order.total, Decimal("1500.00"))

    # -------------------------------------------------------------------------
    # G13: Order Tracking Throttling and Uniform Errors
    # -------------------------------------------------------------------------
    def test_g13_order_lookup_returns_uniform_error_for_missing_and_mismatched(self):
        """Error message must be identical whether order doesn't exist or contact doesn't match."""
        lookup_url = reverse("storefront:order_lookup")

        # 1. Nonexistent order reference
        resp_missing = self.client.post(lookup_url, {"order_ref": "MN-NONEXISTENT", "contact": "0712345678"})
        # 2. Existing order with wrong contact
        resp_mismatch = self.client.post(lookup_url, {"order_ref": self.order.receipt_number, "contact": "0700000000"})

        # Messages must be identical
        messages_missing = [m.message for m in resp_missing.context["messages"]]
        messages_mismatch = [m.message for m in resp_mismatch.context["messages"]]
        self.assertEqual(messages_missing, messages_mismatch)

    def test_g13_order_lookup_throttling_triggers(self):
        """Repeated lookups from the same IP must trigger 429 rate limit."""
        lookup_url = reverse("storefront:order_lookup")
        for _ in range(8):
            self.client.post(lookup_url, {"order_ref": "MN-TEST", "contact": "0700000000"})

        # 9th attempt must receive 429
        resp = self.client.post(lookup_url, {"order_ref": "MN-TEST", "contact": "0700000000"})
        self.assertEqual(resp.status_code, 429)
