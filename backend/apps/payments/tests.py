from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from apps.products.models import Product, Category, Inventory
from apps.orders.models import Cart, CartItem, create_order_from_cart
from apps.payments.models import Payment
from django.db import transaction
import threading

User = get_user_model()


class PaymentsConcurrencyTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.user1 = User.objects.create_user(email='u1@example.com', phone='254700000001', password='pass')
        self.user2 = User.objects.create_user(email='u2@example.com', phone='254700000002', password='pass')
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
        t1.start(); t2.start()
        t1.join(); t2.join()

        # At least one order must succeed, inventory must not go negative
        inv = Inventory.objects.first()
        self.assertGreaterEqual(inv.quantity, 0)
        successes = [r for r in results.values() if r[0] == 'ok']
        self.assertTrue(len(successes) >= 1)


class PaymentIdempotencyTests(TransactionTestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='p@example.com', phone='254700000003', password='pass')
        cat = Category.objects.create(name='Toys')
        prod = Product.objects.create(name='Rattle', slug='rattle-2', category=cat, price=100.00)
        Inventory.objects.create(product=prod, quantity=5)
        self.cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=self.cart, product=prod, quantity=2)

    def test_payment_verify_idempotent(self):
        order = create_order_from_cart(self.user, self.cart, coupon=None, receipt_number='r1')
        payment = Payment.objects.create(order=order, amount=order.total, status='initiated', checkout_request_id='ck1')

        # Simulate two parallel verification attempts that use select_for_update
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
        t1.start(); t2.start()
        t1.join(); t2.join()

        p = Payment.objects.get(pk=payment.pk)
        o = p.order
        self.assertEqual(p.status, 'completed')
        self.assertEqual(o.status, 'paid')
