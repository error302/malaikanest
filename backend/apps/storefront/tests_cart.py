from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from apps.orders.models import Cart, CartItem, Coupon
from apps.products.models import Category, Inventory, Product, ProductVariant


class StorefrontCartTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="Nursery Essentials",
            slug="nursery-essentials",
        )
        self.product = Product.objects.create(
            name="Organic Swaddle Blanket",
            slug="organic-swaddle-blanket",
            price=Decimal("1200.00"),
            stock=10,
            category=self.category,
            is_active=True,
        )
        Inventory.objects.create(product=self.product, quantity=10)

        self.variant_product = Product.objects.create(
            name="Cotton Baby Shoes",
            slug="cotton-baby-shoes",
            price=Decimal("800.00"),
            stock=5,
            category=self.category,
            is_active=True,
        )
        Inventory.objects.create(product=self.variant_product, quantity=5)
        self.variant = ProductVariant.objects.create(
            product=self.variant_product,
            size="0-3m",
            color="white",
            price_modifier=Decimal("100.00"),
        )

    def test_empty_cart_renders_empty_state(self):
        """Visiting empty cart returns 200 and indicates bag is empty."""
        response = self.client.get(reverse("storefront:cart"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Your Bag is Empty")

    def test_guest_can_add_product_to_cart(self):
        """Guest user can add a standalone product to their session cart."""
        response = self.client.post(
            reverse("storefront:cart_add"),
            {
                "product_id": str(self.product.id),
                "quantity": 2,
            },
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Organic Swaddle Blanket")
        self.assertContains(response, "1200")

        cart = Cart.objects.filter(session_key=self.client.session.session_key).first()
        self.assertIsNotNone(cart)
        self.assertEqual(cart.items.count(), 1)
        item = cart.items.first()
        self.assertEqual(item.product, self.product)
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.unit_price, Decimal("1200.00"))

    def test_guest_can_add_variant_to_cart(self):
        """Guest user can add a product variant to cart with price modifier applied."""
        response = self.client.post(
            reverse("storefront:cart_add"),
            {
                "product_id": str(self.variant_product.id),
                "variant_id": str(self.variant.id),
                "quantity": 1,
            },
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Cotton Baby Shoes")
        # 800 + 100 = 900
        self.assertContains(response, "900")

        cart = Cart.objects.filter(session_key=self.client.session.session_key).first()
        item = cart.items.first()
        self.assertEqual(item.variant, self.variant)
        self.assertEqual(item.unit_price, Decimal("900.00"))

    def test_add_to_cart_exceeding_stock_fails(self):
        """Adding more items than available stock fails with an error message."""
        response = self.client.post(
            reverse("storefront:cart_add"),
            {
                "product_id": str(self.product.id),
                "quantity": 15,  # stock is 10
            },
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Only 10 item(s) available in stock")

        cart = Cart.objects.filter(session_key=self.client.session.session_key).first()
        self.assertTrue(cart is None or cart.items.count() == 0)

    def test_update_cart_item_quantity(self):
        """Guest can update item quantity in cart."""
        # Add initial item
        self.client.post(
            reverse("storefront:cart_add"),
            {"product_id": str(self.product.id), "quantity": 1},
        )
        cart = Cart.objects.get(session_key=self.client.session.session_key)
        item = cart.items.first()

        # Update to 3
        response = self.client.post(
            reverse("storefront:cart_update"),
            {"item_id": str(item.id), "quantity": 3},
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 3)

    def test_remove_cart_item(self):
        """Guest can remove an item from the cart."""
        self.client.post(
            reverse("storefront:cart_add"),
            {"product_id": str(self.product.id), "quantity": 1},
        )
        cart = Cart.objects.get(session_key=self.client.session.session_key)
        item = cart.items.first()

        response = self.client.post(
            reverse("storefront:cart_remove"),
            {"item_id": str(item.id)},
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(cart.items.count(), 0)
        self.assertContains(response, "Your Bag is Empty")

    def test_coupon_application_and_discount(self):
        """Applying a valid coupon applies discount to cart total."""
        coupon = Coupon.objects.create(
            code="SAVE200",
            discount_type=Coupon.DISCOUNT_TYPE_FLAT,
            discount_value=Decimal("200.00"),
            min_order_value=Decimal("1000.00"),
            is_active=True,
        )
        # Add 1 blanket (1200)
        self.client.post(
            reverse("storefront:cart_add"),
            {"product_id": str(self.product.id), "quantity": 1},
        )

        response = self.client.post(
            reverse("storefront:cart_apply_coupon"),
            {"code": "SAVE200"},
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "SAVE200")
        self.assertContains(response, "-KES 200")

    def test_free_shipping_at_threshold(self):
        """Cart subtotal >= 2000 qualifies for free delivery across Kenya."""
        # Add 2 blankets = 2400 >= 2000
        response = self.client.post(
            reverse("storefront:cart_add"),
            {"product_id": str(self.product.id), "quantity": 2},
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "FREE Delivery")
