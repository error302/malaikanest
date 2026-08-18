"""
PayPal REST API V2 Integration & Payment Gateway for Malaika Nest.

Supports PayPal wallet checkout and Debit/Credit Card processing via PayPal Orders V2.
Follows the architecture documented in Obsidian Vault (METARDU PayPal v6 Engine).
"""
import base64
import logging
import os
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Optional

import requests
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from apps.core.outbox import publish_event
from apps.orders.models import Order
from .gateway import PaymentGateway
from .models import Payment, PaymentAuditLog

logger = logging.getLogger("apps.payments.paypal")

# Supported PayPal currencies
PAYPAL_SUPPORTED_CURRENCIES = {
    "USD", "EUR", "GBP", "AUD", "CAD", "CHF", "CZK", "DKK",
    "HKD", "HUF", "ILS", "JPY", "MXN", "NOK", "NZD", "PHP",
    "PLN", "SEK", "SGD", "THB", "TWD"
}

# Approximate conversion rate for KES to USD if currency is KES
# (can be overridden via KES_USD_EXCHANGE_RATE env var)
DEFAULT_KES_PER_USD = Decimal("130.00")


class PayPalService:
    """
    Client for PayPal REST Orders V2 API.
    Handles token authentication, order creation, capture, and verification.
    """

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        mode: Optional[str] = None,
    ):
        self.client_id = client_id or os.getenv("PAYPAL_CLIENT_ID", "").strip()
        self.client_secret = client_secret or os.getenv("PAYPAL_CLIENT_SECRET", "").strip()
        self.mode = mode or os.getenv("PAYPAL_MODE", "sandbox").strip().lower()

    @property
    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    @property
    def base_url(self) -> str:
        return (
            "https://api-m.sandbox.paypal.com"
            if self.mode == "sandbox"
            else "https://api-m.paypal.com"
        )

    def get_access_token(self) -> str:
        """
        Fetch or retrieve cached OAuth2 Bearer token from PayPal.
        """
        if not self.is_configured:
            raise ValueError("PayPal credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are not configured.")

        cache_key = f"paypal_oauth_token_{self.mode}_{self.client_id[:8]}"
        cached_token = cache.get(cache_key)
        if cached_token:
            return cached_token

        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_creds = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")

        url = f"{self.base_url}/v1/oauth2/token"
        headers = {
            "Authorization": f"Basic {encoded_creds}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {"grant_type": "client_credentials"}

        try:
            resp = requests.post(url, headers=headers, data=data, timeout=15)
            resp.raise_for_status()
            res_data = resp.json()
            access_token = res_data["access_token"]
            expires_in = res_data.get("expires_in", 3600)

            # Cache token for 90% of its expiration time
            cache.set(cache_key, access_token, timeout=max(60, expires_in - 120))
            return access_token
        except Exception as exc:
            logger.error("Failed to obtain PayPal access token in %s mode: %s", self.mode, exc)
            raise RuntimeError(f"PayPal authentication failed: {exc}") from exc

    def convert_amount(self, amount_kes: Decimal) -> tuple[Decimal, str]:
        """
        Converts KES amount to USD (or configured target currency) for PayPal processing.
        Returns (converted_amount, currency_code).
        """
        rate_str = os.getenv("KES_USD_EXCHANGE_RATE", "").strip()
        try:
            rate = Decimal(rate_str) if rate_str else DEFAULT_KES_PER_USD
        except Exception:
            rate = DEFAULT_KES_PER_USD

        usd_amount = (Decimal(str(amount_kes)) / rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return max(usd_amount, Decimal("0.01")), "USD"

    def create_order(
        self,
        order: Order,
        payment: Payment,
        return_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Calls PayPal POST /v2/checkout/orders to create an order.
        """
        token = self.get_access_token()
        usd_amount, currency = self.convert_amount(Decimal(str(order.total)))

        frontend_url = os.getenv("FRONTEND_URL", "https://malaikanest.com").rstrip("/")
        ret_url = return_url or f"{frontend_url}/checkout/success?order={order.receipt_number}&token={order.checkout_token}"
        can_url = cancel_url or f"{frontend_url}/checkout"

        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": f"malaika_order_{order.id}",
                    "description": f"Malaika Nest Order #{order.receipt_number}",
                    "custom_id": f"MALAIKA_{order.id}",
                    "invoice_id": str(order.receipt_number),
                    "amount": {
                        "currency_code": currency,
                        "value": str(usd_amount),
                    },
                }
            ],
            "application_context": {
                "brand_name": "Malaika Nest",
                "landing_page": "NO_PREFERENCE",
                "user_action": "PAY_NOW",
                "return_url": ret_url,
                "cancel_url": can_url,
            },
        }

        url = f"{self.base_url}/v2/checkout/orders"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        logger.info("Creating PayPal order for Order #%s (KES %s -> USD %s)", order.receipt_number, order.total, usd_amount)
        resp = requests.post(url, headers=headers, json=payload, timeout=20)
        
        if not resp.ok:
            logger.error("PayPal create order failed: %s %s", resp.status_code, resp.text)
            raise RuntimeError(f"PayPal create order error: {resp.text}")

        data = resp.json()
        paypal_order_id = data.get("id")

        # Record initiation in PaymentAuditLog
        PaymentAuditLog.objects.create(
            payment=payment,
            event_type="stk_initiated",
            payload={"paypal_order_id": paypal_order_id, "amount_usd": str(usd_amount), "mode": self.mode},
            notes=f"PayPal order created: {paypal_order_id}",
            source="paypal",
        )

        return {
            "paypal_order_id": paypal_order_id,
            "status": data.get("status"),
            "amount_usd": str(usd_amount),
            "currency": currency,
            "links": data.get("links", []),
        }

    def capture_order(self, paypal_order_id: str, payment: Payment) -> dict[str, Any]:
        """
        Calls PayPal POST /v2/checkout/orders/{id}/capture to capture payment.
        """
        token = self.get_access_token()
        url = f"{self.base_url}/v2/checkout/orders/{paypal_order_id}/capture"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        logger.info("Capturing PayPal order %s for Payment #%s", paypal_order_id, payment.id)
        resp = requests.post(url, headers=headers, json={}, timeout=25)

        if not resp.ok:
            logger.error("PayPal capture failed for %s: %s %s", paypal_order_id, resp.status_code, resp.text)
            raise RuntimeError(f"PayPal capture failed: {resp.text}")

        data = resp.json()
        status_val = data.get("status")

        if status_val == "COMPLETED":
            # Extract transaction capture id
            captures = (
                data.get("purchase_units", [{}])[0]
                .get("payments", {})
                .get("captures", [{}])
            )
            capture_id = captures[0].get("id") if captures else paypal_order_id

            with transaction.atomic():
                p = Payment.objects.select_for_update().get(pk=payment.pk)
                p.status = "completed"
                p.paypal_transaction_id = capture_id
                p.completed_at = timezone.now()
                p.raw_callback_json = data
                p.save(update_fields=["status", "paypal_transaction_id", "completed_at", "raw_callback_json", "updated_at"])

                order = p.order
                order.status = "paid"
                order.payment_method = p.payment_method
                order.paid_at = timezone.now()
                order.save(update_fields=["status", "payment_method", "paid_at", "updated_at"])

                PaymentAuditLog.objects.create(
                    payment=p,
                    event_type="callback_completed",
                    payload=data,
                    notes=f"PayPal payment captured successfully: {capture_id}",
                    source="paypal",
                )

                # Transactional outbox event to generate PDF invoice and send email receipt
                publish_event(
                    event_type="order.paid",
                    payload={
                        "order_id": order.id,
                        "receipt_number": order.receipt_number,
                        "payment_id": p.id,
                        "payment_method": p.payment_method,
                        "total": str(order.total),
                        "customer_email": order.customer_email or order.guest_email,
                    },
                )

            logger.info("Payment #%s and Order #%s marked as COMPLETED/PAID via PayPal %s", payment.id, payment.order.receipt_number, capture_id)

            return {
                "status": "completed",
                "paypal_transaction_id": capture_id,
                "order_id": payment.order.id,
                "receipt_number": payment.order.receipt_number,
            }
        else:
            with transaction.atomic():
                p = Payment.objects.select_for_update().get(pk=payment.pk)
                p.status = "failed"
                p.raw_callback_json = data
                p.save(update_fields=["status", "raw_callback_json", "updated_at"])

                PaymentAuditLog.objects.create(
                    payment=p,
                    event_type="callback_failed",
                    payload=data,
                    notes=f"PayPal capture returned non-completed status: {status_val}",
                    source="paypal",
                )

            return {
                "status": "failed",
                "paypal_status": status_val,
                "detail": "PayPal capture did not complete",
            }


class PayPalGateway(PaymentGateway):
    """Concrete gateway strategy for PayPal wallet."""

    def __init__(self, **kwargs):
        self.service = PayPalService()

    def initiate(self, payment: Payment, **kwargs) -> dict[str, Any]:
        return self.service.create_order(
            order=payment.order,
            payment=payment,
            return_url=kwargs.get("return_url"),
            cancel_url=kwargs.get("cancel_url"),
        )

    def verify(self, payment: Payment, **kwargs) -> dict[str, Any]:
        return {
            "status": payment.status,
            "paypal_transaction_id": payment.paypal_transaction_id,
        }

    def cancel(self, payment: Payment, **kwargs) -> dict[str, Any]:
        with transaction.atomic():
            p = Payment.objects.select_for_update().get(pk=payment.pk)
            p.status = "cancelled"
            p.save(update_fields=["status", "updated_at"])
        return {"status": "cancelled"}


class CardGateway(PaymentGateway):
    """Concrete gateway strategy for Debit/Credit Card (processed via PayPal Orders v2)."""

    def __init__(self, **kwargs):
        self.service = PayPalService()

    def initiate(self, payment: Payment, **kwargs) -> dict[str, Any]:
        return self.service.create_order(
            order=payment.order,
            payment=payment,
            return_url=kwargs.get("return_url"),
            cancel_url=kwargs.get("cancel_url"),
        )

    def verify(self, payment: Payment, **kwargs) -> dict[str, Any]:
        return {
            "status": payment.status,
            "paypal_transaction_id": payment.paypal_transaction_id,
        }

    def cancel(self, payment: Payment, **kwargs) -> dict[str, Any]:
        with transaction.atomic():
            p = Payment.objects.select_for_update().get(pk=payment.pk)
            p.status = "cancelled"
            p.save(update_fields=["status", "updated_at"])
        return {"status": "cancelled"}
