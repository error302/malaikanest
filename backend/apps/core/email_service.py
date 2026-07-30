"""
Centralised email service for Malaika Nest.

Every outbound email flows through ``EmailService`` so that:
- HTML/text rendering is consistent (template → HTML → strip → plain-text)
- Every send is logged to ``EmailLog`` for audit / debugging
- Attachments (PDF invoices) are handled uniformly
- Callers never construct ``EmailMultiAlternatives`` directly
"""

import logging
import time

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger("apps.core.email")

# ──────────────────────────────────────────────
#  Email types — used as EmailLog.email_type
# ──────────────────────────────────────────────
VERIFICATION = "verification"
PASSWORD_RESET = "password_reset"
ORDER_CONFIRMATION = "order_confirmation"
PAYMENT_CONFIRMATION = "payment_confirmation"
ORDER_SHIPPED = "order_shipped"
ORDER_DELIVERED = "order_delivered"
REVIEW_REQUEST = "review_request"
ABANDONED_CART = "abandoned_cart"
INVOICE = "invoice"
CRITICAL_ALERT = "critical_alert"
HEALTH_CHECK = "health_check"
ORDER_CONFIRMATION_PLAIN = "order_confirmation"  # keeping for backward compat


class EmailService:
    """Send emails with consistent rendering, delivery, and logging."""

    # ── Template map: email_type → (template_name, subject_template) ──────
    TEMPLATE_MAP: dict[str, tuple[str, str]] = {
        VERIFICATION: (
            "emails/verify_email.html",
            "Verify Your Email — Malaika Nest",
        ),
        PASSWORD_RESET: (
            None,  # plain-text only — no HTML template
            "Reset Your Password - Malaika Nest",
        ),
        ORDER_CONFIRMATION: (
            "emails/order_confirmation.html",
            "Order Confirmation - #{order_id}",
        ),
        PAYMENT_CONFIRMATION: (
            "emails/payment_confirmation.html",
            "Your Order Invoice {invoice_number}",
        ),
        ORDER_SHIPPED: (
            "emails/order_shipped.html",
            "Your Order Has Been Shipped - #{order_id}",
        ),
        ORDER_DELIVERED: (
            "emails/order_delivered.html",
            "Your Order Has Been Delivered - #{order_id}",
        ),
        REVIEW_REQUEST: (
            "emails/review_request.html",
            "How was your purchase? Share your review!",
        ),
        ABANDONED_CART: (
            "emails/abandoned_cart.html",
            "You left something behind! Complete your order",
        ),
        INVOICE: (
            "emails/invoice_email.html",
            "Invoice - Order #{order_id}",
        ),
        CRITICAL_ALERT: (
            None,  # plain-text only
            "[Malaika Nest] Critical Alert: {alert_type}",
        ),
        HEALTH_CHECK: (
            None,  # plain-text only
            "[Malaika Nest] Email Health Check",
        ),
    }

    @classmethod
    def _format_subject(cls, subject_template: str, **context) -> str:
        """Format a subject string with context values."""
        try:
            return subject_template.format(**context)
        except (KeyError, ValueError):
            return subject_template

    @classmethod
    def _attach_invoice_pdf(cls, message: EmailMultiAlternatives, invoice) -> None:
        """Attach an invoice PDF to the message, falling back to regeneration."""
        if not invoice or not invoice.pdf_file:
            return

        filename = getattr(invoice.pdf_file, "name", "") or f"invoice-{invoice.invoice_number}.pdf"
        filename = filename.split("/")[-1]

        try:
            if hasattr(invoice.pdf_file, "open"):
                invoice.pdf_file.open("rb")
                try:
                    data = invoice.pdf_file.read()
                finally:
                    try:
                        invoice.pdf_file.close()
                    except Exception:
                        pass
                if data:
                    message.attach(filename, data, "application/pdf")
                    return
            else:
                message.attach_file(invoice.pdf_file.path)
                return
        except Exception as exc:
            logger.warning("Could not read stored invoice PDF %s, regenerating: %s", filename, exc)

        # Fallback: regenerate in-memory
        from apps.orders.invoice import generate_invoice_pdf

        pdf_content, _ = generate_invoice_pdf(invoice.order, invoice.invoice_number)
        if pdf_content:
            message.attach(filename, pdf_content, "application/pdf")

    @classmethod
    def _log(
        cls,
        email_type: str,
        recipient: str,
        subject: str,
        template_name: str | None,
        success: bool,
        duration_ms: int,
        error: str | None = None,
        order_id: str | None = None,
    ) -> object | None:
        """Persist a send attempt to EmailLog."""
        try:
            from .models import EmailLog

            return EmailLog.objects.create(
                email_type=email_type,
                recipient=recipient,
                subject=subject,
                template_name=template_name or "",
                success=success,
                duration_ms=duration_ms,
                error_message=error or "",
                order_id=order_id or "",
            )
        except Exception as exc:
            logger.warning("EmailLog write skipped: %s", exc)
            return None

    # ── Public API ──────────────────────────────────────────────────────

    @classmethod
    def send(
        cls,
        email_type: str,
        to: list[str],
        subject: str,
        template_name: str | None = None,
        context: dict | None = None,
        text_body: str | None = None,
        attachments: list[tuple[str, bytes, str]] | None = None,
        invoice=None,
        order_id: str | None = None,
    ) -> tuple[bool, str]:
        """
        Render and send one email.  Returns ``(success, message)``.

        * If *template_name* is given, the HTML body is rendered from it and a
          plain-text alternative is auto-generated via ``strip_tags``.
        * If *text_body* is given (and no template_name), it is sent as
          plain-text only.
        * *attachments* is a list of ``(filename, bytes, mimetype)`` tuples.
        * *invoice* – if set, the invoice PDF is fetched and attached.
        """
        start = time.monotonic()

        try:
            # ── Render body ──
            html_body = None
            if template_name:
                html_body = render_to_string(template_name, context or {})
                text_body = text_body or strip_tags(html_body)

            if not text_body and not html_body:
                return False, "no body content"

            # ── Build message ──
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body or "",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=to,
            )
            if html_body:
                msg.attach_alternative(html_body, "text/html")

            # ── Attach invoice PDF ──
            if invoice:
                cls._attach_invoice_pdf(msg, invoice)

            # ── Attach extra files ──
            if attachments:
                for filename, data, mimetype in attachments:
                    msg.attach(filename, data, mimetype)

            # ── Send ──
            msg.send(fail_silently=False)

            duration = int((time.monotonic() - start) * 1000)
            cls._log(email_type, to[0], subject, template_name, True, duration, order_id=order_id)
            logger.info("Email %s sent to %s in %dms", email_type, to[0], duration)
            return True, "sent"

        except Exception as exc:
            duration = int((time.monotonic() - start) * 1000)
            error_msg = str(exc)
            cls._log(email_type, to[0], subject, template_name, False, duration, error=error_msg, order_id=order_id)
            logger.error("Email %s to %s failed after %dms: %s", email_type, to[0], duration, error_msg)
            return False, error_msg

    # ── Convenience methods ──────────────────────────────────────────────

    @classmethod
    def send_verification(cls, email: str, verify_url: str, first_name: str = "") -> tuple[bool, str]:
        subject = cls._format_subject(cls.TEMPLATE_MAP[VERIFICATION][1])
        context = {
            "customer_name": first_name or "Valued Customer",
            "verify_url": verify_url,
        }
        return cls.send(VERIFICATION, [email], subject, cls.TEMPLATE_MAP[VERIFICATION][0], context)

    @classmethod
    def send_password_reset(cls, email: str, reset_url: str) -> tuple[bool, str]:
        subject = cls._format_subject(cls.TEMPLATE_MAP[PASSWORD_RESET][1])
        text = f"Click here to reset your password: {reset_url}\n\nThis link expires in 24 hours."
        return cls.send(PASSWORD_RESET, [email], subject, text_body=text)

    @classmethod
    def send_order_confirmation(cls, order) -> tuple[bool, str]:
        subject = cls._format_subject(cls.TEMPLATE_MAP[ORDER_CONFIRMATION][1], order_id=order.id)
        context = {
            "order": order,
            "customer_name": order.customer_name,
            "company_name": "Malaika Nest",
            "company_email": "hello@malaikanest.com",
        }
        return cls.send(
            ORDER_CONFIRMATION, [order.customer_email], subject,
            cls.TEMPLATE_MAP[ORDER_CONFIRMATION][0], context,
            order_id=str(order.id),
        )

    @classmethod
    def send_payment_confirmation(cls, order, invoice=None) -> tuple[bool, str]:
        inv_num = invoice.invoice_number if invoice else order.id
        subject = cls._format_subject(cls.TEMPLATE_MAP[PAYMENT_CONFIRMATION][1], invoice_number=inv_num)
        context = {
            "order": order,
            "invoice": invoice,
            "customer_name": order.customer_name,
            "company_name": "Malaika Nest",
            "company_email": "hello@malaikanest.com",
            "company_phone": "+254 726 771 321",
        }
        return cls.send(
            PAYMENT_CONFIRMATION, [order.customer_email], subject,
            cls.TEMPLATE_MAP[PAYMENT_CONFIRMATION][0], context,
            invoice=invoice,
            order_id=str(order.id),
        )

    @classmethod
    def send_order_shipped(cls, order) -> tuple[bool, str]:
        subject = cls._format_subject(cls.TEMPLATE_MAP[ORDER_SHIPPED][1], order_id=order.id)
        context = {
            "order": order,
            "customer_name": order.customer_name,
            "company_name": "Malaika Nest",
            "company_email": "hello@malaikanest.com",
            "tracking_number": order.tracking_number,
            "shipping_carrier": order.shipping_carrier,
        }
        return cls.send(
            ORDER_SHIPPED, [order.customer_email], subject,
            cls.TEMPLATE_MAP[ORDER_SHIPPED][0], context,
            order_id=str(order.id),
        )

    @classmethod
    def send_order_delivered(cls, order) -> tuple[bool, str]:
        subject = cls._format_subject(cls.TEMPLATE_MAP[ORDER_DELIVERED][1], order_id=order.id)
        context = {
            "order": order,
            "customer_name": order.customer_name,
            "company_name": "Malaika Nest",
            "company_email": "hello@malaikanest.com",
        }
        return cls.send(
            ORDER_DELIVERED, [order.customer_email], subject,
            cls.TEMPLATE_MAP[ORDER_DELIVERED][0], context,
            order_id=str(order.id),
        )

    @classmethod
    def send_review_request(cls, order) -> tuple[bool, str]:
        subject = cls.TEMPLATE_MAP[REVIEW_REQUEST][1]
        items = [{"name": item.product.name, "product_id": item.product.id} for item in order.items.all()]
        context = {
            "order": order,
            "customer_name": order.customer_name,
            "items": items,
            "company_name": "Malaika Nest",
            "company_email": "hello@malaikanest.com",
        }
        return cls.send(
            REVIEW_REQUEST, [order.customer_email], subject,
            cls.TEMPLATE_MAP[REVIEW_REQUEST][0], context,
            order_id=str(order.id),
        )

    @classmethod
    def send_abandoned_cart(cls, email: str, cart_items: list[dict], total: float, first_name: str = "") -> tuple[bool, str]:
        subject = cls.TEMPLATE_MAP[ABANDONED_CART][1]
        context = {
            "items": cart_items,
            "total": total,
            "user": {"first_name": first_name} if first_name else {"first_name": "there"},
            "cart_age_hours": 24,
        }
        return cls.send(ABANDONED_CART, [email], subject, cls.TEMPLATE_MAP[ABANDONED_CART][0], context)

    @classmethod
    def send_invoice(cls, order, invoice=None) -> tuple[bool, str]:
        subject = cls._format_subject(cls.TEMPLATE_MAP[INVOICE][1], order_id=order.id)
        context = {
            "order": order,
            "invoice": invoice,
            "customer_name": order.customer_name,
            "company_name": "Malaika Nest",
        }
        return cls.send(
            INVOICE, [order.customer_email], subject,
            cls.TEMPLATE_MAP[INVOICE][0], context,
            invoice=invoice,
            order_id=str(order.id),
        )

    @classmethod
    def send_critical_alert(cls, alert_type: str, message: str, context_info: dict | None = None) -> tuple[bool, str]:
        from django.utils import timezone

        admin_emails = []
        if hasattr(settings, "ADMINS"):
            admin_emails = [email for _, email in settings.ADMINS]
        if not admin_emails:
            admin_emails = ["hello@malaikanest.com"]

        subject = cls._format_subject(cls.TEMPLATE_MAP[CRITICAL_ALERT][1], alert_type=alert_type)
        text = (
            f"Critical Alert: {alert_type}\n\n"
            f"Message: {message}\n\n"
            f"Context: {context_info or 'No additional context'}\n\n"
            f"Timestamp: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        return cls.send(CRITICAL_ALERT, admin_emails, subject, text_body=text)
