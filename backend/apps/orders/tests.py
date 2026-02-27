from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.products.models import Product, Category, Inventory
from apps.orders.models import Cart, CartItem, create_order_from_cart


User = get_user_model()


class OrderFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', phone='254700000000', password='password123')
        self.cat = Category.objects.create(name='Toys')
        self.prod = Product.objects.create(name='Rattle', slug='rattle', category=self.cat, price=100.00)
        self.inv = Inventory.objects.create(product=self.prod, quantity=10)
        self.cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=self.cart, product=self.prod, quantity=2)

    def test_create_order_from_cart(self):
        order = create_order_from_cart(self.user, self.cart, coupon=None, receipt_number='rcpt123')
        self.assertEqual(order.total, 200.00)
        inv = Inventory.objects.get(product=self.prod)
        self.assertEqual(inv.quantity, 8)
        self.assertEqual(order.items.count(), 1)
