import threading
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import transaction
from django.test import TransactionTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.orders.models import Cart, CartItem, Order, create_order_from_cart
from apps.payments.models import Payment, PaymentAuditLog
from apps.products.models import Category, Inventory, Product


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
            order = create_order_from_cart(user, cart, coupon=None, receipt_number=f'rcpt-{idx}')
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
        order = create_order_from_cart(self.user, self.cart, coupon=None, receipt_number='r1')
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

    def test_callback_is_idempotent_for_duplicate_success(self):
        payload = self._callback_payload()

        first = self.client.post(
            '/api/payments/mpesa/callback/',
            payload,
            format='json',
            HTTP_X_FORWARDED_FOR='196.201.214.20',
        )
        second = self.client.post(
            '/api/payments/mpesa/callback/',
            payload,
            format='json',
            HTTP_X_FORWARDED_FOR='196.201.214.20',
        )

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)

        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.payment.status, 'completed')
        self.assertEqual(self.order.status, 'paid')
        self.assertEqual(PaymentAuditLog.objects.filter(payment=self.payment, event_type='callback_duplicate').count(), 1)

    def test_callback_rejects_amount_mismatch(self):
        payload = self._callback_payload(amount='1.00')
        response = self.client.post(
            '/api/payments/mpesa/callback/',
            payload,
            format='json',
            HTTP_X_FORWARDED_FOR='196.201.214.20',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json().get('ResultCode'), 1)

        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.payment.status, 'failed')
        self.assertNotEqual(self.order.status, 'paid')

    def test_callback_rejects_phone_mismatch(self):
        payload = self._callback_payload(phone='254799999999')
        response = self.client.post(
            '/api/payments/mpesa/callback/',
            payload,
            format='json',
            HTTP_X_FORWARDED_FOR='196.201.214.20',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json().get('ResultCode'), 1)

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'failed')

    def test_non_admin_cannot_access_admin_reconcile(self):
        self.client.force_authenticate(self.user)
        response = self.client.get('/api/payments/admin/reconcile/candidates/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
