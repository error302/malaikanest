from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from apps.orders.models import Cart, Order
from apps.products.models import Category, Inventory, Product


class StorefrontCheckoutTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="Baby Gifts",
            slug="baby-gifts",
        )
        self.product = Product.objects.create(
            name="Cashmere Baby Blanket",
            slug="cashmere-baby-blanket",
            price=Decimal("2500.00"),
            stock=8,
            category=self.category,
            is_active=True,
        )
        Inventory.objects.create(product=self.product, quantity=8)

    def _add_product_to_cart(self, quantity=1):
        self.client.post(
            reverse("storefront:cart_add"),
            {"product_id": str(self.product.id), "quantity": quantity},
        )

    def test_checkout_empty_cart_redirects_to_cart(self):
        """Visiting /checkout/ with an empty bag redirects to /cart/."""
        response = self.client.get(reverse("storefront:checkout"))
        self.assertEqual(response.status_code, 302)
        self.assertIn("/cart/", response.url)

    def test_checkout_renders_cart_items_and_totals(self):
        """Visiting /checkout/ with items renders the checkout form and order summary."""
        self._add_product_to_cart(quantity=1)
        response = self.client.get(reverse("storefront:checkout"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Cashmere Baby Blanket")
        self.assertContains(response, "2500")
        self.assertContains(response, "FREE")  # 2500 >= 2000 free delivery
        self.assertContains(response, "M-Pesa STK Push")
        self.assertContains(response, "3370347")  # Till number

    def test_guest_checkout_places_order_and_reserves_stock(self):
        """Submitting the checkout form reserves stock, clears cart, and creates order."""
        self._add_product_to_cart(quantity=2)

        post_data = {
            "shipping_name": "Amina Mohamed",
            "shipping_phone": "0712345678",
            "guest_email": "amina@example.com",
            "shipping_address": "Nyali Links Rd, Apartment 3B",
            "shipping_city": "Mombasa",
            "shipping_county": "Mombasa",
            "delivery_region": "mombasa",
            "payment_method": "mpesa",
            "notes": "Please call before arrival",
            "is_gift": "on",
            "gift_message": "Welcome to the world, baby!",
        }

        response = self.client.post(reverse("storefront:checkout"), post_data, follow=True)
        self.assertEqual(response.status_code, 200)

        # Order created
        order = Order.objects.filter(guest_email="amina@example.com").first()
        self.assertIsNotNone(order)
        self.assertEqual(order.shipping_first_name, "Amina")
        self.assertEqual(order.shipping_last_name, "Mohamed")
        self.assertEqual(order.shipping_phone, "0712345678")
        self.assertEqual(order.delivery_region, "mombasa")
        self.assertEqual(order.total, Decimal("5000.00"))  # 2 * 2500, free shipping
        self.assertTrue(order.is_gift)
        self.assertEqual(order.gift_message, "Welcome to the world, baby!")

        # Inventory reserved
        self.product.inventory.refresh_from_db()
        self.assertEqual(self.product.inventory.reserved, 2)
        self.assertEqual(self.product.inventory.available(), 6)

        # Cart cleared
        cart = Cart.objects.filter(session_key=self.client.session.session_key).first()
        self.assertEqual(cart.items.count(), 0)

        # Order confirmation page rendered
        self.assertContains(response, order.receipt_number)
        self.assertContains(response, "3370347")

    def test_order_status_access_control(self):
        """Guest order status requires the correct checkout_token."""
        self._add_product_to_cart(quantity=1)
        self.client.post(
            reverse("storefront:checkout"),
            {
                "shipping_name": "Zahra Ali",
                "shipping_phone": "0722000000",
                "guest_email": "zahra@example.com",
                "shipping_address": "Kilimani, Nairobi",
                "delivery_region": "nairobi",
                "payment_method": "till",
            },
        )
        order = Order.objects.get(guest_email="zahra@example.com")

        # Without token -> 404
        unauth_response = self.client.get(
            reverse("storefront:order_status", kwargs={"receipt_number": order.receipt_number})
        )
        self.assertEqual(unauth_response.status_code, 404)

        # With correct token -> 200
        auth_response = self.client.get(
            reverse("storefront:order_status", kwargs={"receipt_number": order.receipt_number})
            + f"?token={order.checkout_token}"
        )
        self.assertEqual(auth_response.status_code, 200)
        self.assertContains(auth_response, order.receipt_number)
        self.assertContains(auth_response, "Zahra Ali")

    def test_order_status_poll_endpoint(self):
        """Polling endpoint returns order status and paid flag as JSON."""
        self._add_product_to_cart(quantity=1)
        self.client.post(
            reverse("storefront:checkout"),
            {
                "shipping_name": "Fatma Omar",
                "shipping_phone": "0733000000",
                "guest_email": "fatma@example.com",
                "shipping_address": "CBD, Mombasa",
                "delivery_region": "mombasa",
                "payment_method": "till",
            },
        )
        order = Order.objects.get(guest_email="fatma@example.com")

        # Poll endpoint initially pending
        poll_url = reverse("storefront:order_status_poll", kwargs={"receipt_number": order.receipt_number})
        resp = self.client.get(f"{poll_url}?token={order.checkout_token}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["receipt_number"], order.receipt_number)
        self.assertEqual(data["status"], "pending")
        self.assertFalse(data["is_paid"])

        # Update order to paid
        order.status = "paid"
        order.mpesa_receipt_number = "QKD1234567"
        order.save()

        # Poll endpoint reflects paid
        resp_paid = self.client.get(f"{poll_url}?token={order.checkout_token}")
        self.assertEqual(resp_paid.status_code, 200)
        data_paid = resp_paid.json()
        self.assertEqual(data_paid["status"], "paid")
        self.assertTrue(data_paid["is_paid"])
        self.assertEqual(data_paid["mpesa_receipt"], "QKD1234567")
