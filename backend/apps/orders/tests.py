from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from apps.products.models import Product, Category, Inventory
from apps.orders.models import Cart, CartItem, Order, DeliveryZone, get_delivery_fee_for_region

User = get_user_model()


class DeliveryZoneTest(TestCase):
    def test_seeded_fees(self):
        zones = DeliveryZone.objects.all()
        self.assertGreaterEqual(len(zones), 0)
        for z in zones:
            self.assertIsInstance(z.fee, Decimal)

    def test_get_fallback_when_table_empty(self):
        fee = get_delivery_fee_for_region("nairobi")
        self.assertEqual(fee, Decimal("300"))


class StateMachineTransitionTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="a@b.com", phone_number="+254712345678", password="x")
        self.order = Order.objects.create(user=self.user, total=Decimal("100"), status=Order.STATUS_PENDING)

    def test_valid_pending_to_paid(self):
        ok, err = self.order.transition_to(Order.STATUS_PAID)
        self.assertTrue(ok)
        self.assertIsNone(err)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.STATUS_PAID)
        self.assertIsNotNone(self.order.paid_at)

    def test_valid_paid_to_processing(self):
        self.order.transition_to(Order.STATUS_PAID)
        ok, err = self.order.transition_to(Order.STATUS_PROCESSING)
        self.assertTrue(ok)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.STATUS_PROCESSING)
        self.assertIsNotNone(self.order.processed_at)

    def test_valid_pending_to_cancelled(self):
        ok, err = self.order.transition_to(Order.STATUS_CANCELLED)
        self.assertTrue(ok)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.STATUS_CANCELLED)
        self.assertIsNotNone(self.order.cancelled_at)

    def test_invalid_transition(self):
        self.order.transition_to(Order.STATUS_CANCELLED)
        ok, err = self.order.transition_to(Order.STATUS_PAID)
        self.assertFalse(ok)
        self.assertIn("Invalid transition", err)

    def test_already_delivered_cannot_cancel(self):
        self.order.transition_to(Order.STATUS_PAID)
        self.order.transition_to(Order.STATUS_PROCESSING)
        self.order.transition_to(Order.STATUS_SHIPPED)
        ok, err = self.order.transition_to(Order.STATUS_DELIVERED)
        self.assertTrue(ok)
        ok, err = self.order.transition_to(Order.STATUS_CANCELLED)
        self.assertFalse(ok, "Delivered orders should not be cancellable")

    def test_emits_outbox_event_on_paid(self):
        with patch("apps.core.outbox.publish_event") as mock_publish:
            ok, _ = self.order.transition_to(Order.STATUS_PAID, publish=True)
            self.assertTrue(ok)
            mock_publish.assert_called_once()
            args = mock_publish.call_args
            self.assertEqual(args[0][0], "order")
            self.assertEqual(args[0][2], "order.paid")


class OrderServiceCancelTest(TestCase):
    def setUp(self):
        from apps.products.models import Category, Inventory
        self.user = User.objects.create_user(email="cancel@t.com", phone_number="+254712345679", password="x")
        self.cat = Category.objects.create(name="Test", slug="test")
        self.product = Product.objects.create(
            name="Test Product", slug="test-p", price=Decimal("50"),
            category=self.cat, description="x",
        )
        Inventory.objects.create(product=self.product, quantity=10)
        self.cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)
        from apps.orders.services import OrderService
        self.order = OrderService.process_checkout(cart=self.cart, user=self.user)

    def test_cancel_releases_inventory(self):
        inv = Inventory.objects.get(product=self.product)
        reserved_before = inv.reserved
        from apps.orders.services import OrderService
        OrderService.cancel_order(self.order)
        inv.refresh_from_db()
        self.assertEqual(inv.reserved, reserved_before - 2)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.STATUS_CANCELLED)

    def test_cancel_twice_raises(self):
        from apps.orders.services import OrderService
        OrderService.cancel_order(self.order)
        with self.assertRaises(ValueError):
            OrderService.cancel_order(self.order)


class PaymentGatewayFactoryTest(TestCase):
    def test_resolves_mpesa(self):
        from apps.payments.gateway import PaymentGatewayFactory, MpesaGateway
        gateway = PaymentGatewayFactory.create("mpesa")
        self.assertIsInstance(gateway, MpesaGateway)

    def test_unimplemented_gateway_raises(self):
        from apps.payments.gateway import PaymentGatewayFactory
        gateway = PaymentGatewayFactory.create("paypal")
        with self.assertRaises(NotImplementedError):
            gateway.initiate(None)


class IdempotencyKeyTest(TestCase):
    def test_valid_key(self):
        from apps.core.idempotency import IdempotencyKey
        k = IdempotencyKey("abc-123")
        self.assertEqual(str(k), "abc-123")

    def test_empty_key_raises(self):
        from apps.core.idempotency import IdempotencyKey
        with self.assertRaises(ValueError):
            IdempotencyKey("")

    def test_oversized_key_raises(self):
        from apps.core.idempotency import IdempotencyKey
        with self.assertRaises(ValueError):
            IdempotencyKey("x" * 200)


class DeliveryFeeCalculationTest(TestCase):
    def test_get_fee_via_model(self):
        zone = DeliveryZone.objects.create(slug="test-zone", name="Test", fee=Decimal("150"), is_active=True)
        fee = get_delivery_fee_for_region("test-zone")
        self.assertEqual(fee, Decimal("150"))

    def test_inactive_zone_fallsback(self):
        DeliveryZone.objects.create(slug="off", name="Off", fee=Decimal("999"), is_active=False)
        fee = get_delivery_fee_for_region("off")
        self.assertEqual(fee, Decimal("0"))


class EventEmissionTest(TestCase):
    def test_order_cancelled_emits_event(self):
        user = User.objects.create_user(email="ev@t.com", phone_number="+254712345680", password="x")
        order = Order.objects.create(user=user, total=Decimal("50"), status=Order.STATUS_PAYMENT_FAILED)
        with patch("apps.core.outbox.publish_event") as mock:
            ok, _ = order.transition_to(Order.STATUS_CANCELLED, publish=True)
            self.assertTrue(ok)
            mock.assert_called_once()
            args = mock.call_args
            self.assertEqual(args[0][2], "order.cancelled")
