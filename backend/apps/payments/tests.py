import requests
from django.core.management import call_command
from django.utils import timezone
from apps.core.models import OutboxEvent
from apps.payments.mpesa_verification import verify_payment
import os
import threading
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import transaction
from django.test import TransactionTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.orders.models import Cart, CartItem, Order, OrderItem, create_order_from_cart
from apps.orders.services import OrderService
from apps.payments.models import Payment, PaymentAuditLog
from apps.products.models import Category, Inventory, Product, ProductVariant, VariantInventory


User = get_user_model()


class PaymentsConcurrencyTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.user1 = User.objects.create_user(email='u1@example.com', phone_number='+254700000001', password='pass')
        self.user2 = User.objects.create_user(email='u2@example.com', phone_number='+254700000002', password='pass')
        cat = Category.objects.create(name='Essentials')
        prod = Product.objects.create(name='Onesie', slug='onesie', category=cat, price=250.00)
        Inventory.objects.create(product=prod, quantity=1)

        self.cart1 = Cart.objects.create(user=self.user1)
        CartItem.objects.create(cart=self.cart1, product=prod, quantity=1)

        self.cart2 = Cart.objects.create(user=self.user2)
        CartItem.objects.create(cart=self.cart2, product=prod, quantity=1)

    def _create_order(self, user, cart, results, idx):
        try:
            order = create_order_from_cart(user, cart, coupon=None)
            results[idx] = ('ok', order.id)
        except Exception as e:
            results[idx] = ('err', str(e))

    def test_concurrent_order_creation_not_oversell(self):
        results = {}
        t1 = threading.Thread(target=self._create_order, args=(self.user1, self.cart1, results, 1))
        t2 = threading.Thread(target=self._create_order, args=(self.user2, self.cart2, results, 2))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        inv = Inventory.objects.first()
        self.assertGreaterEqual(inv.quantity, 0)
        successes = [r for r in results.values() if r[0] == 'ok']
        self.assertTrue(len(successes) >= 1)


class PaymentIdempotencyTests(TransactionTestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='p@example.com', phone_number='+254700000003', password='pass')
        cat = Category.objects.create(name='Toys')
        prod = Product.objects.create(name='Rattle', slug='rattle-2', category=cat, price=100.00)
        Inventory.objects.create(product=prod, quantity=5)
        self.cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=self.cart, product=prod, quantity=2)

    def test_payment_verify_idempotent(self):
        order = create_order_from_cart(self.user, self.cart, coupon=None)
        payment = Payment.objects.create(order=order, amount=order.total, status='initiated', mpesa_checkout_request_id='ck1')

        def mark_completed():
            with transaction.atomic():
                p = Payment.objects.select_for_update().get(pk=payment.pk)
                if p.status != 'completed':
                    p.status = 'completed'
                    p.mpesa_receipt_number = 'RCPT123'
                    p.save()
                    o = p.order
                    if o.status != 'paid':
                        o.status = 'paid'
                        o.save()

        t1 = threading.Thread(target=mark_completed)
        t2 = threading.Thread(target=mark_completed)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        p = Payment.objects.get(pk=payment.pk)
        o = p.order
        self.assertEqual(p.status, 'completed')
        self.assertEqual(o.status, 'paid')


class MpesaCallbackValidationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='pay-user@example.com',
            phone_number='+254700000004',
            password='Pass12345!'
        )
        self.order = Order.objects.create(
            user=self.user,
            total='200.00',
            status='pending',
            receipt_number='RCPT-CB-001',
        )

        self._delay_patcher = patch('apps.orders.signals.send_order_confirmation.delay', return_value=None)
        self._delay_patcher.start()
        self.addCleanup(self._delay_patcher.stop)

        self.payment = Payment.objects.create(
            order=self.order,
            amount='200.00',
            payment_method='mpesa',
            phone_number='254700000004',
            mpesa_checkout_request_id='ws_co_123',
            mpesa_merchant_request_id='merchant-001',
            mpesa_sent_amount=200,
            mpesa_destination='3370347',
            status='initiated',
        )

    def _callback_payload(self, amount='200.00', phone='254700000004', result_code=0):
        return {
            'Body': {
                'stkCallback': {
                    'MerchantRequestID': 'merchant-001',
                    'CheckoutRequestID': 'ws_co_123',
                    'ResultCode': result_code,
                    'ResultDesc': 'The service request is processed successfully.',
                    'CallbackMetadata': {
                        'Item': [
                            {'Name': 'Amount', 'Value': float(amount)},
                            {'Name': 'MpesaReceiptNumber', 'Value': 'NLJ7RT61SV'},
                            {'Name': 'TransactionDate', 'Value': 20260101010101},
                            {'Name': 'PhoneNumber', 'Value': int(phone)},
                        ]
                    },
                }
            }
        }

    def post_callback(self, payload):
        return self.client.post('/api/payments/mpesa/callback/', payload, format='json')

    def query_reply(self, **overrides):
        return {
            "ResponseCode": "0", "ResultCode": "0", "CheckoutRequestID": "ws_co_123",
            "MerchantRequestID": "merchant-001", **overrides,
        }

    def test_forged_success_only_schedules_a_query(self):
        response = self.post_callback(self._callback_payload())
        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertIsNotNone(self.payment.mpesa_next_query_at)
        self.assertIsNone(self.payment.mpesa_receipt_number)
        self.assertEqual(self.payment.status, "initiated")
        self.assertEqual(self.order.status, "pending")
        with patch("apps.payments.mpesa_verification.query_provider", return_value=self.query_reply(ResultCode="1032")):
            self.assertEqual(verify_payment(self.payment.pk), "cancelled")
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "cancelled")

    def test_verified_no_response_releases_only_the_orders_variant_reservation(self):
        category = Category.objects.create(name="Test clothes")
        product = Product.objects.create(name="Test dress", category=category, price="200.00")
        variant = ProductVariant.objects.create(product=product, size="9y", color="pink")
        inventory, _ = VariantInventory.objects.update_or_create(
            variant=variant, defaults={"quantity": 2, "reserved": 2},
        )
        OrderItem.objects.create(
            order=self.order, product=product, variant_reference=str(variant.pk), price="200.00", quantity=1,
        )
        with patch("apps.payments.mpesa_verification.query_provider", return_value=self.query_reply(ResultCode="1038")):
            self.assertEqual(verify_payment(self.payment.pk), "failed")
            self.assertEqual(verify_payment(self.payment.pk), "failed")

        self.order.refresh_from_db()
        inventory.refresh_from_db()
        self.assertEqual(self.order.status, "cancelled")
        self.assertTrue(self.order.inventory_restored)
        self.assertIsNone(self.order.paid_at)
        self.assertEqual((inventory.quantity, inventory.reserved), (2, 1))
        self.assertFalse(OutboxEvent.objects.filter(aggregate_id=str(self.order.pk), event_type="order.paid").exists())

    def test_open_stk_prompt_blocks_manual_order_cancellation(self):
        with self.assertRaisesMessage(ValueError, "Confirm the M-Pesa payment outcome"):
            OrderService.cancel_order(self.order)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.STATUS_PENDING)

    def test_duplicate_callbacks_only_schedule_one_query_and_fulfillment(self):
        self.post_callback(self._callback_payload())
        self.payment.refresh_from_db()
        scheduled = self.payment.mpesa_next_query_at
        self.post_callback(self._callback_payload())
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.mpesa_next_query_at, scheduled)

        with patch("apps.payments.mpesa_verification.query_provider", return_value=self.query_reply()) as provider:
            self.assertEqual(verify_payment(self.payment.pk), "completed")
            self.assertEqual(verify_payment(self.payment.pk), "already completed")
            provider.assert_called_once()
        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "paid")
        self.assertIsNone(self.payment.mpesa_receipt_number)
        self.assertEqual(self.payment.mpesa_issue, "receipt_unverified")
        self.assertEqual(OutboxEvent.objects.filter(aggregate_id=str(self.order.pk), event_type="order.paid").count(), 1)

    def test_untrusted_amount_or_phone_mismatch_is_advisory(self):
        self.post_callback(self._callback_payload(amount="1.00", phone="254799999999"))
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "initiated")
        self.assertEqual(self.payment.mpesa_callback_summary["issue"], "callback_metadata_mismatch")
        self.assertNotIn("receipt", self.payment.mpesa_callback_summary)

    def test_authenticated_amount_mismatch_holds_fulfillment(self):
        self.post_callback(self._callback_payload())
        with patch("apps.payments.mpesa_verification.query_provider", return_value=self.query_reply(Amount=1)):
            self.assertEqual(verify_payment(self.payment.pk), "needs review")
        self.order.refresh_from_db()
        self.payment.refresh_from_db()
        self.assertEqual(self.order.status, "pending")
        self.assertEqual(self.payment.mpesa_issue, "intent_mismatch")

    def test_forged_merchant_reference_and_malformed_callback(self):
        payload = self._callback_payload()
        payload["Body"]["stkCallback"]["MerchantRequestID"] = "other-merchant"
        self.assertEqual(self.post_callback(payload).status_code, 200)
        self.payment.refresh_from_db()
        self.assertIsNone(self.payment.mpesa_next_query_at)
        self.assertEqual(self.post_callback({"Body": []}).status_code, 400)
        self.assertEqual(self.client.post(
            "/api/payments/mpesa/callback/", "x" * 16385, content_type="application/json",
        ).status_code, 413)

    def test_network_failure_backs_off_before_delayed_confirmation(self):
        self.post_callback(self._callback_payload())
        with patch("apps.payments.mpesa_verification.query_provider", side_effect=requests.Timeout):
            call_command("process_mpesa_queries")
            self.assertEqual(verify_payment(self.payment.pk), "waiting for retry")
        self.payment.refresh_from_db()
        self.assertGreater(self.payment.mpesa_next_query_at, timezone.now())
        self.assertEqual(self.payment.mpesa_query_attempts, 1)
        Payment.objects.filter(pk=self.payment.pk).update(mpesa_next_query_at=timezone.now())
        with patch("apps.payments.mpesa_verification.query_provider", return_value=self.query_reply()):
            self.assertEqual(verify_payment(self.payment.pk), "completed")

    def test_wrong_checkout_id_from_authenticated_query_does_not_complete(self):
        with patch("apps.payments.mpesa_verification.query_provider", return_value=self.query_reply(CheckoutRequestID="another-checkout")):
            self.assertEqual(verify_payment(self.payment.pk), "pending")
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "pending")

    def test_late_money_does_not_reopen_cancelled_order(self):
        self.order.transition_to(Order.STATUS_CANCELLED)
        with patch("apps.payments.mpesa_verification.query_provider", return_value=self.query_reply()):
            self.assertEqual(verify_payment(self.payment.pk), "completed")
        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.payment.mpesa_issue, "order_closed")
        self.assertEqual(self.order.status, "cancelled")
        self.assertFalse(OutboxEvent.objects.filter(aggregate_id=str(self.order.pk), event_type="order.paid").exists())

    def test_statement_match_attaches_receipt_to_confirmed_payment_once(self):
        Payment.objects.filter(pk=self.payment.pk).update(status="completed", mpesa_issue="receipt_unverified")
        for _ in range(2):
            call_command(
                "record_mpesa_statement_match", str(self.payment.pk), receipt="NLJ7RT61SV",
                amount="200", till="3370347", statement_matched=True,
            )
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.mpesa_receipt_number, "NLJ7RT61SV")
        self.assertEqual(self.payment.mpesa_issue, "")
        self.assertIsNotNone(self.payment.mpesa_statement_verified_at)

    @patch.dict(os.environ, {
        "MPESA_ENV": "live", "MPESA_CONSUMER_KEY": "qa-key", "MPESA_CONSUMER_SECRET": "qa-secret",
        "MPESA_PASSKEY": "qa-pass", "MPESA_CALLBACK_URL": "https://mal-shop.invalid/callback/",
    })
    @patch("apps.payments.services.PaymentService.get_mpesa_oauth_token", return_value="qa-token")
    @patch("apps.payments.services.requests.post")
    def test_initiation_uses_server_total_and_reuses_active_request(self, post, _oauth):
        Payment.objects.filter(pk=self.payment.pk).update(mpesa_checkout_request_id=None)
        post.return_value.status_code = 200
        post.return_value.json.return_value = {
            "ResponseCode": "0", "CheckoutRequestID": "new-checkout", "MerchantRequestID": "new-merchant",
        }
        self.client.force_authenticate(self.user)
        for _ in range(2):
            response = self.client.post("/api/payments/mpesa/initiate/", {
                "order_id": self.order.pk, "amount": 1, "phone": self.payment.phone_number,
            }, format="json")
            self.assertEqual(response.status_code, 200, response.json())
        self.assertEqual(post.call_count, 1)
        self.assertEqual(post.call_args.kwargs["json"]["Amount"], 200)

    @patch.dict(os.environ, {
        "MPESA_ENV": "live", "MPESA_CONSUMER_KEY": "qa-key", "MPESA_CONSUMER_SECRET": "qa-secret",
        "MPESA_PASSKEY": "qa-pass", "MPESA_CALLBACK_URL": "https://mal-shop.invalid/callback/",
    })
    @patch("apps.payments.services.PaymentService.get_mpesa_oauth_token", return_value="qa-token")
    @patch("apps.payments.services.requests.post", side_effect=requests.Timeout)
    def test_unknown_initiation_result_does_not_send_another_prompt(self, post, _oauth):
        Payment.objects.filter(pk=self.payment.pk).update(mpesa_checkout_request_id=None)
        self.client.force_authenticate(self.user)
        for _ in range(2):
            response = self.client.post("/api/payments/mpesa/initiate/", {
                "order_id": self.order.pk, "phone": self.payment.phone_number,
            }, format="json")
            self.assertEqual(response.status_code, 400)
        self.assertEqual(post.call_count, 1)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.mpesa_issue, "initiation_unknown")

    def test_payment_dashboard_is_staff_only(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get("/api/payments/admin/mpesa/").status_code, 403)
        self.user.is_staff = True
        response = self.client.get("/api/payments/admin/mpesa/?state=pending")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.order.receipt_number)

    def test_non_admin_cannot_access_admin_reconcile(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/payments/admin/reconcile/candidates/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
