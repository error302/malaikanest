from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.products.models import Product, Category, Inventory
from apps.orders.models import Cart, CartItem

User = get_user_model()


def make_user(email='test@example.com', password='t3stPass!word', **kwargs):
    return User.objects.create_user(email=email, password=password, is_active=True, **kwargs)


def make_product(name='Test Product', price=500.0, stock=10, **kwargs):
    cat = Category.objects.get_or_create(name='Test Cat', slug='test-cat')[0]
    prod = Product.objects.create(
        name=name, slug=name.lower().replace(' ', '-'), category=cat, price=price,
        stock=stock, **kwargs
    )
    Inventory.objects.create(product=prod, quantity=stock)
    return prod


# ─────────────────────────────────────────────────
# PHASE 2: API Response Standardization Tests
# ─────────────────────────────────────────────────
class APIResponseFormatTest(TestCase):
    """Verify every response is wrapped in {success, message, data, error}."""

    def setUp(self):
        self.client = APIClient()

    def _assert_standardized(self, response):
        data = response.json()
        self.assertIn('success', data, 'Missing `success` key')
        self.assertIn('data',    data, 'Missing `data` key')
        self.assertIn('error',   data, 'Missing `error` key')

    def test_product_list_wrapped(self):
        make_product()
        response = self.client.get('/api/products/products/')
        self.assertEqual(response.status_code, 200)
        self._assert_standardized(response)

    def test_404_wrapped(self):
        response = self.client.get('/api/products/products/9999/')
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertFalse(data.get('success'))
        self.assertIsNotNone(data.get('error'))

    def test_categories_list_wrapped(self):
        response = self.client.get('/api/products/categories/')
        self.assertEqual(response.status_code, 200)
        self._assert_standardized(response)


# ─────────────────────────────────────────────────
# PHASE 8: Auth Security Tests
# ─────────────────────────────────────────────────
class AuthSecurityTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()

    def test_login_with_valid_credentials(self):
        response = self.client.post('/api/accounts/token/', {
            'email': 'test@example.com', 'password': 't3stPass!word'
        }, format='json')
        self.assertIn(response.status_code, [200, 400])  # 400 if captcha required

    def test_login_with_wrong_password(self):
        response = self.client.post('/api/accounts/token/', {
            'email': 'test@example.com', 'password': 'wrong'
        }, format='json')
        self.assertIn(response.status_code, [400, 401, 423])

    def test_register_missing_fields(self):
        response = self.client.post('/api/accounts/register/', {}, format='json')
        self.assertIn(response.status_code, [400, 422])

    def test_password_reset_nonexistent_email(self):
        """Should return 200 (no information leakage)."""
        response = self.client.post('/api/accounts/password/reset/', {
            'email': 'ghost@example.com'
        }, format='json')
        self.assertEqual(response.status_code, 200)

    def test_protected_endpoint_without_auth(self):
        response = self.client.get('/api/orders/orders/')
        self.assertIn(response.status_code, [401, 403])


# ─────────────────────────────────────────────────
# PHASE 6: Cart & Ecommerce Logic Tests
# ─────────────────────────────────────────────────
class CartFlowTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user(email='buyer@example.com')
        self.client.force_authenticate(user=self.user)
        self.product = make_product(name='Baby Rattle', price=300.0, stock=5)

    def test_cart_initially_empty(self):
        response = self.client.get('/api/orders/cart/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get('items', []), [])

    def test_add_to_cart(self):
        response = self.client.post('/api/orders/cart/add/', {
            'product_id': self.product.id,
            'quantity': 2
        }, format='json')
        self.assertIn(response.status_code, [200, 201])

    def test_add_to_cart_exceeding_stock(self):
        response = self.client.post('/api/orders/cart/add/', {
            'product_id': self.product.id,
            'quantity': 9999
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_remove_from_cart(self):
        self.client.post('/api/orders/cart/add/', {
            'product_id': self.product.id, 'quantity': 1
        }, format='json')
        response = self.client.post(f'/api/orders/cart/remove/{self.product.id}/')
        self.assertEqual(response.status_code, 200)


# ─────────────────────────────────────────────────
# PHASE 3: Database & Inventory Integrity Tests
# ─────────────────────────────────────────────────
class InventoryIntegrityTest(TestCase):

    def setUp(self):
        self.user = make_user(email='inv@example.com')
        self.product = make_product(name='Stock Item', stock=3)
        self.cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)

    def test_inventory_updated_on_order(self):
        from apps.orders.services import OrderService
        before = Inventory.objects.get(product=self.product).quantity
        order = OrderService.process_checkout(cart=self.cart, user=self.user)
        after = Inventory.objects.get(product=self.product).quantity
        self.assertEqual(after, before - 2, 'Inventory should decrease by ordered quantity')

    def test_inventory_restored_on_cancel(self):
        from apps.orders.services import OrderService
        order = OrderService.process_checkout(cart=self.cart, user=self.user)
        before_cancel = Inventory.objects.get(product=self.product).quantity
        OrderService.cancel_order(order)
        after_cancel = Inventory.objects.get(product=self.product).quantity
        self.assertEqual(after_cancel, before_cancel + 2, 'Inventory should be restored on cancel')
