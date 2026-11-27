from decimal import Decimal
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

from django.core import mail
from django.template.loader import render_to_string
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from apps.orders.models import Cart, Order
from apps.payments.models import Payment
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
            status="published",
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
        self._add_product_to_cart(quantity=8)
        response = self.client.get(reverse("storefront:checkout"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Cashmere Baby Blanket")
        self.assertContains(response, "2,500")
        self.assertContains(response, "FREE")  # 20000 >= 10000 free delivery
        self.assertContains(response, "M-Pesa STK Push")
        self.assertContains(response, 'name="payment_method" value="paypal"')
        self.assertNotContains(response, 'name="payment_method" value="till"')

    def test_checkout_exposes_authoritative_region_fees(self):
        """Displayed delivery fees come from the same source used to charge the order."""
        from apps.orders.models import get_delivery_fee_for_region

        self.product.price = Decimal("2000.00")
        self.product.save(update_fields=["price"])
        self._add_product_to_cart(quantity=1)
        response = self.client.get(reverse("storefront:checkout"))
        self.assertEqual(response.status_code, 200)
        fees = response.context["region_fees"]
        for region in ("mombasa", "nairobi", "upcountry"):
            with self.subTest(region=region):
                self.assertEqual(Decimal(fees[region]), get_delivery_fee_for_region(region))
        from apps.core.models import SiteSettings
        self.assertEqual(
            response.context["free_shipping_threshold"], SiteSettings.get_free_shipping_threshold()
        )
        self.assertContains(response, "data-region-fees")

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    @patch("apps.storefront.views_checkout.PaymentService.initiate_mpesa_stk")
    def test_stk_checkout_renders_receipts_with_line_totals(self, initiate_stk):
        self._add_product_to_cart(quantity=2)
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(reverse("storefront:checkout"), {
                "shipping_name": "Amina Mohamed",
                "shipping_phone": "0712345678",
                "guest_email": "amina@example.com",
                "delivery_region": "mombasa_pickup",
                "payment_method": "mpesa",
            })
        self.assertEqual(response.status_code, 302)
        order = Order.objects.get(guest_email="amina@example.com")
        self.assertEqual(order.items.get().total_price, Decimal("5000.00"))
        initiate_stk.assert_called_once()
        self.assertEqual(len(mail.outbox), 1)
        confirmation, _ = mail.outbox[0].alternatives[0]
        self.assertIn(order.get_payment_method_display(), confirmation)
        self.assertIn("KES 5000", confirmation)
        self.assertIn("KES 5000", render_to_string("emails/payment_confirmation.html", {"order": order}))

    def test_old_checkout_submission_cannot_create_a_till_order(self):
        self._add_product_to_cart()
        response = self.client.post(reverse("storefront:checkout"), {
            "shipping_name": "Amina Mohamed",
            "payment_method": "till",
        }, follow=True)
        self.assertContains(response, "Choose M-Pesa STK Push or PayPal.")
        self.assertContains(response, 'value="Amina Mohamed"')
        self.assertEqual(Order.objects.count(), 0)

    @patch("apps.payments.paypal.PayPalService.capture_order", return_value={"status": "completed"})
    @patch("apps.payments.paypal.PayPalGateway")
    def test_paypal_checkout_returns_to_capture_with_the_same_order(self, gateway, capture):
        self._add_product_to_cart()
        gateway.return_value.service.mode = "live"
        gateway.return_value.initiate.return_value = {
            "links": [{"rel": "payer-action", "href": "https://www.paypal.com/checkoutnow?token=QA-PAYPAL"}],
        }
        response = self.client.post(reverse("storefront:checkout"), {
            "shipping_name": "Amina Mohamed",
            "shipping_phone": "0712345678",
            "guest_email": "amina@example.com",
            "delivery_region": "mombasa_pickup",
            "payment_method": "paypal",
        })
        order = Order.objects.get(guest_email="amina@example.com")
        payment = Payment.objects.get(order=order)
        payment.paypal_transaction_id = "QA-PAYPAL"
        payment.save(update_fields=["paypal_transaction_id"])
        self.assertEqual(response.url, "https://www.paypal.com/checkoutnow?token=QA-PAYPAL")
        return_url = urlsplit(gateway.return_value.initiate.call_args.kwargs["return_url"])
        self.assertEqual(return_url.path, reverse("storefront:paypal_return"))
        self.assertEqual(parse_qs(return_url.query)["receipt"], [order.receipt_number])
        url = f"{return_url.path}?{return_url.query}"
        self.client.get(url + "&token=OTHER-PAYMENT")
        capture.assert_not_called()
        response = self.client.get(url + "&token=QA-PAYPAL")
        capture.assert_called_once_with("QA-PAYPAL", payment)
        self.assertRedirects(response, reverse("storefront:order_status", args=[order.receipt_number]))

    def test_guest_checkout_places_order_and_reserves_stock(self):
        """Submitting the checkout form reserves stock, clears cart, and creates order."""
        self._add_product_to_cart(quantity=4)

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
        self.assertEqual(order.shipping_phone, "254712345678")
        self.assertEqual(order.delivery_region, "mombasa")
        self.assertEqual(order.total, Decimal("10000.00"))  # 4 * 2500, free shipping
        self.assertTrue(order.is_gift)
        self.assertEqual(order.gift_message, "Welcome to the world, baby!")

        # Inventory reserved
        self.product.inventory.refresh_from_db()
        self.assertEqual(self.product.inventory.reserved, 4)
        self.assertEqual(self.product.inventory.available(), 4)

        # Cart cleared
        cart = Cart.objects.filter(session_key=self.client.session.session_key).first()
        self.assertEqual(cart.items.count(), 0)

        # Order confirmation page rendered
        self.assertContains(response, order.receipt_number)
        self.assertNotContains(response, "Pay via Buy Goods Till")

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
                "payment_method": "mpesa",
            },
        )
        order = Order.objects.get(guest_email="zahra@example.com")

        # Unauthenticated external visitor without token or session -> does not expose order details, renders verify prompt
        unauth_client = Client()
        unauth_response = unauth_client.get(
            reverse("storefront:order_status", kwargs={"receipt_number": order.receipt_number})
        )
        self.assertNotContains(unauth_response, "Zahra Ali")
        self.assertContains(unauth_response, "Verify Order #")

        # With correct token -> 200
        auth_response = unauth_client.get(
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
                "payment_method": "mpesa",
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
