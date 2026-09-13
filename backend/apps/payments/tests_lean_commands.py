from decimal import Decimal
from io import StringIO
from unittest.mock import patch, MagicMock

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.core.email_service import ORDER_CONFIRMATION
from apps.core.models import EmailLog
from apps.orders.models import Order
from apps.payments.models import Payment, PaymentAuditLog
from apps.products.models import Product, Category


class LeanManagementCommandsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="shopper@example.com",
            password="StrongPassword123!",
            phone_number="+254712345678",
        )
        self.category = Category.objects.create(name="Clothing", slug="clothing")
        self.product = Product.objects.create(
            name="Baby Onesie",
            slug="baby-onesie",
            price=Decimal("1500.00"),
            stock=10,
            category=self.category,
            is_active=True,
        )
        self.order = Order.objects.create(
            user=self.user,
            total=Decimal("1500.00"),
            status=Order.STATUS_PENDING,
            delivery_region="nairobi",
        )
        self.payment = Payment.objects.create(
            order=self.order,
            amount=Decimal("1500.00"),
            payment_method="mpesa",
            phone_number="+254712345678",
            mpesa_checkout_request_id="ws_CO_TEST_12345",
            status="initiated",
            initiated_at=timezone.now() - timezone.timedelta(minutes=5),
        )

    def test_reconcile_pending_payments_idempotent(self):
        """reconcile_pending_payments runs safely and updates initiated payment to completed."""
        out = StringIO()

        with patch("apps.payments.management.commands.reconcile_pending_payments.verify_mpesa_payment_async") as mock_verify:
            def complete_payment(payment_id):
                p = Payment.objects.get(pk=payment_id)
                p.status = "completed"
                p.mpesa_receipt_number = "TESTREC001"
                p.save()
                p.order.status = Order.STATUS_PAID
                p.order.save()
                return "completed"

            mock_verify.side_effect = complete_payment

            # First run: should process and complete
            call_command("reconcile_pending_payments", stale_minutes=1, stdout=out)
            self.payment.refresh_from_db()
            self.order.refresh_from_db()
            self.assertEqual(self.payment.status, "completed")
            self.assertEqual(self.order.status, Order.STATUS_PAID)

            # Second run immediately: should find 0 initiated payments or skip
            out2 = StringIO()
            call_command("reconcile_pending_payments", stale_minutes=1, stdout=out2)
            self.assertIn("Found 0 pending", out2.getvalue())

    def test_retry_order_emails_prevents_duplicate_sends(self):
        """retry_order_emails must never send duplicate emails if an order confirmation already succeeded."""
        self.order.status = Order.STATUS_PAID
        self.order.save()

        # Log that an order confirmation was already sent
        EmailLog.objects.create(
            email_type=ORDER_CONFIRMATION,
            recipient=self.user.email,
            order_id=str(self.order.id),
            success=True,
        )

        out = StringIO()
        with patch("apps.core.email_service.EmailService.send_order_confirmation") as mock_send:
            call_command("retry_order_emails", stdout=out)
            mock_send.assert_not_called()
            self.assertIn("Skipped (already delivered): 1", out.getvalue())

    def test_retry_order_emails_retries_when_no_successful_log(self):
        """retry_order_emails dispatches email when order is paid and no successful EmailLog exists."""
        self.order.status = Order.STATUS_PAID
        self.order.save()

        out = StringIO()
        with patch("apps.core.email_service.EmailService.send_order_confirmation") as mock_send:
            mock_send.return_value = (True, "Delivered")
            call_command("retry_order_emails", stdout=out)
            mock_send.assert_called_once_with(self.order)
            self.assertIn("Sent: 1", out.getvalue())
