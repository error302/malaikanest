import datetime
import logging
import os
import uuid
from decimal import Decimal, ROUND_HALF_UP

import requests
from django.db import transaction
from django.utils import timezone

from apps.core.circuit_breaker import call_with_breaker, CircuitOpen
from apps.core.outbox import publish_event
from apps.core import metrics
from .models import Payment, PaymentAuditLog
from .services import audit_log

logger = logging.getLogger("apps.payments")

PESAPAL_SANDBOX_BASE = "https://cybqa.pesapal.com/pesapalv3"
PESAPAL_LIVE_BASE = "https://pay.pesapal.com/v3"


def _pesapal_base_url() -> str:
    env = (os.getenv("PESAPAL_ENV", "sandbox") or "sandbox").strip().lower()
    return PESAPAL_LIVE_BASE if env in {"live", "production", "prod"} else PESAPAL_SANDBOX_BASE


def _pesapal_should_mock() -> bool:
    """
    When no real Pesapal keys are configured we fall back to a mock that
    auto-completes the payment (mirrors the M-Pesa dev mock). This keeps the
    checkout flow exercisable in dev without sandbox credentials.
    """
    explicit = os.getenv("PESAPAL_MOCK_MODE")
    if explicit is not None:
        return explicit.strip().lower() in {"1", "true", "yes", "on"}
    return bool(os.getenv("DEBUG", "False").lower() in {"1", "true", "yes", "on"})


def _pesapal_configured() -> bool:
    key = os.getenv("PESAPAL_CONSUMER_KEY", "").strip()
    secret = os.getenv("PESAPAL_CONSUMER_SECRET", "").strip()
    return bool(key) and bool(secret) and not key.lower().startswith("changeme") and not secret.lower().startswith("changeme")


class PesapalError(Exception):
    pass


class PesapalService:
    @staticmethod
    def get_access_token() -> str:
        if not _pesapal_configured():
            raise PesapalError("Pesapal credentials missing")

        cache_key = f"pesapal:token:{_pesapal_base_url()}"
        cached = _cache_get(cache_key)
        if cached:
            return str(cached)

        url = f"{_pesapal_base_url()}/api/Auth/RequestToken"
        payload = {
            "consumer_key": os.getenv("PESAPAL_CONSUMER_KEY"),
            "consumer_secret": os.getenv("PESAPAL_CONSUMER_SECRET"),
        }
        resp = call_with_breaker(
            "pesapal_auth",
            lambda: requests.post(url, json=payload, timeout=30),
        )
        if resp.status_code != 200:
            raise PesapalError(f"Pesapal auth failed: HTTP {resp.status_code}")
        data = resp.json()
        token = data.get("token")
        if not token:
            raise PesapalError("Pesapal auth returned no token")
        # Tokens are valid 5 minutes; cache for 4.5 minutes to stay safe.
        _cache_set(cache_key, token, timeout=270)
        return str(token)

    @staticmethod
    def get_ipn_id() -> str:
        """
        Return a registered IPN id, registering one on first use.

        Pesapal requires a registered IPN URL before SubmitOrder. We cache the
        id; if PESAPAL_IPN_ID is provided in env we trust it directly.
        """
        env_id = os.getenv("PESAPAL_IPN_ID", "").strip()
        if env_id:
            return env_id

        cache_key = f"pesapal:ipn:{_pesapal_base_url()}"
        cached = _cache_get(cache_key)
        if cached:
            return str(cached)

        url = f"{_pesapal_base_url()}/api/URLSetup/RegisterIPN"
        ipn_url = os.getenv("PESAPAL_IPN_URL") or os.getenv(
            "PESAPAL_CALLBACK_URL", "https://api.malaikanest.com/api/v1/payments/pesapal/ipn/"
        ).replace("/callback/", "/ipn/")
        token = PesapalService.get_access_token()
        payload = {"url": ipn_url, "ipn_notification_type": "GET"}
        resp = call_with_breaker(
            "pesapal_ipn",
            lambda: requests.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                timeout=30,
            ),
        )
        if resp.status_code != 200:
            raise PesapalError(f"Pesapal IPN registration failed: HTTP {resp.status_code}")
        data = resp.json()
        ipn_id = data.get("ipn_id") or data.get("ipn_idefir") or data.get("id")
        if not ipn_id:
            raise PesapalError("Pesapal IPN registration returned no id")
        _cache_set(cache_key, ipn_id, timeout=86400)
        return str(ipn_id)

    @staticmethod
    def submit_order(payment: Payment, billing: dict) -> dict:
        """
        Create a Pesapal order and return the redirect URL the shopper must open.

        `billing` keys: email, phone, first_name, last_name, country_code (default KE).
        Persists the merchant reference + tracking id onto the Payment row.
        """
        order = payment.order
        merchant_ref = f"{order.receipt_number}-{payment.id}"
        tracking_id = f"MOCK-{uuid.uuid4().hex}" if _pesapal_should_mock() else None

        if _pesapal_should_mock():
            # Dev fallback: complete immediately so the flow is testable.
            with transaction.atomic():
                p = Payment.objects.select_for_update().get(pk=payment.pk)
                p.pesapal_merchant_reference = merchant_ref
                p.pesapal_tracking_id = tracking_id
                p.pesapal_confirmation_code = f"MOCK{uuid.uuid4().hex[:10].upper()}"
                p.status = "completed"
                p.raw_callback = {"mock": True, "merchant_ref": merchant_ref}
                p.completed_at = timezone.now()
                p.callback_received_at = timezone.now()
                p.save(
                    update_fields=[
                        "pesapal_merchant_reference",
                        "pesapal_tracking_id",
                        "pesapal_confirmation_code",
                        "status",
                        "raw_callback_json",
                        "completed_at",
                        "callback_received_at",
                        "updated_at",
                    ]
                )
                order.status = "paid"
                order.payment_method = "pesapal"
                order.transaction_id = p.pesapal_confirmation_code
                order.paid_at = timezone.now()
                order.save(
                    update_fields=["status", "payment_method", "transaction_id", "paid_at", "updated_at"]
                )
            audit_log(
                event_type="pesapal_submitted",
                payload={"mock": True, "merchant_ref": merchant_ref, "payment_id": payment.id},
                payment=payment,
                notes="Pesapal order submitted in mock mode (auto-completed)",
                source="api",
            )
            PesapalService._fire_post_payment(order.id)
            callback_url = os.getenv("PESAPAL_CALLBACK_URL", "https://api.malaikanest.com/api/v1/payments/pesapal/callback/")
            redirect_url = f"{callback_url}?pesapal_transaction_tracking_id={tracking_id}&pesapal_merchant_reference={merchant_ref}"
            return {"order_tracking_id": tracking_id, "redirect_url": redirect_url}

        if not _pesapal_configured():
            raise PesapalError("Pesapal not configured")

        token = PesapalService.get_access_token()
        ipn_id = PesapalService.get_ipn_id()
        callback_url = os.getenv("PESAPAL_CALLBACK_URL", "https://api.malaikanest.com/api/v1/payments/pesapal/callback/")

        amount = Decimal(str(payment.amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        payload = {
            "id": merchant_ref,
            "currency": "KES",
            "amount": float(amount),
            "description": f"Malaika Nest Order {order.receipt_number}",
            "callback_url": callback_url,
            "notification_id": ipn_id,
            "billing_address": {
                "email_address": (billing.get("email") or order.guest_email or "").strip(),
                "phone_number": (billing.get("phone") or order.guest_phone or "").strip(),
                "country_code": (billing.get("country_code") or "KE").strip().upper(),
                "first_name": (billing.get("first_name") or "").strip(),
                "last_name": (billing.get("last_name") or "").strip(),
            },
        }

        url = f"{_pesapal_base_url()}/api/Transactions/SubmitOrderRequest"
        try:
            resp = call_with_breaker(
                "pesapal_api",
                lambda: requests.post(
                    url,
                    json=payload,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                    timeout=30,
                ),
            )
        except CircuitOpen as exc:
            raise PesapalError(f"Pesapal breaker open: {exc}")

        data = resp.json() if resp.content else {}
        if resp.status_code != 200 or data.get("status") != "200" and data.get("error") is not None:
            raise PesapalError(f"Pesapal SubmitOrder failed: {data}")

        order_tracking_id = data.get("order_tracking_id") or data.get("OrderTrackingId")
        redirect_url = data.get("redirect_url") or data.get("RedirectUrl")
        if not order_tracking_id or not redirect_url:
            raise PesapalError(f"Pesapal SubmitOrder returned incomplete response: {data}")

        with transaction.atomic():
            p = Payment.objects.select_for_update().get(pk=payment.pk)
            p.pesapal_merchant_reference = merchant_ref
            p.pesapal_tracking_id = order_tracking_id
            p.save(update_fields=["pesapal_merchant_reference", "pesapal_tracking_id", "updated_at"])

        audit_log(
            event_type="pesapal_submitted",
            payload={"request": payload, "response": data},
            payment=payment,
            notes="Pesapal order submitted",
            source="api",
        )
        return {"order_tracking_id": order_tracking_id, "redirect_url": redirect_url}

    @staticmethod
    def get_transaction_status(order_tracking_id: str) -> dict:
        token = PesapalService.get_access_token()
        url = f"{_pesapal_base_url()}/api/Transactions/GetTransactionStatus"
        resp = call_with_breaker(
            "pesapal_api",
            lambda: requests.get(
                url,
                params={"orderTrackingId": order_tracking_id},
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                timeout=30,
            ),
        )
        if resp.status_code != 200:
            raise PesapalError(f"Pesapal status query failed: HTTP {resp.status_code}")
        return resp.json()

    @staticmethod
    def cancel_order(order_tracking_id: str) -> dict:
        token = PesapalService.get_access_token()
        url = f"{_pesapal_base_url()}/api/Transactions/CancelOrder"
        payload = {"order_tracking_id": order_tracking_id}
        resp = call_with_breaker(
            "pesapal_api",
            lambda: requests.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                timeout=30,
            ),
        )
        return resp.json() if resp.content else {}

    @staticmethod
    def apply_status(payment: Payment, status_resp: dict, *, source: str = "ipn") -> str:
        """
        Apply a Pesapal transaction status to the Payment + Order.

        Returns the resulting Payment status.
        """
        raw_status = (status_resp.get("payment_status") or status_resp.get("status") or "").upper()
        confirmation = status_resp.get("confirmation_code") or status_resp.get("pesapal_transaction_tracking_id")

        event = {
            "COMPLETED": "ipn_completed",
            "FAILED": "ipn_failed",
            "REVERSED": "ipn_failed",
            "INVALID": "ipn_failed",
        }.get(raw_status, "ipn_received")

        if raw_status == "COMPLETED":
            with transaction.atomic():
                p = Payment.objects.select_for_update().select_related("order").get(pk=payment.pk)
                if p.status == "completed":
                    return "completed"
                p.status = "completed"
                if confirmation:
                    p.pesapal_confirmation_code = confirmation
                p.raw_callback = status_resp
                p.callback_received_at = timezone.now()
                p.completed_at = timezone.now()
                p.save(
                    update_fields=[
                        "status",
                        "pesapal_confirmation_code",
                        "raw_callback_json",
                        "callback_received_at",
                        "completed_at",
                        "updated_at",
                    ]
                )
                order = p.order
                order.status = "paid"
                order.payment_method = "pesapal"
                if confirmation:
                    order.transaction_id = confirmation
                order.paid_at = timezone.now()
                order.save(update_fields=["status", "payment_method", "transaction_id", "paid_at", "updated_at"])
            publish_event("order", order.id, "order.paid", {"order_id": order.id})
            metrics.incr("payments.completed")
            audit_log(event_type="ipn_completed", payload=status_resp, payment=payment, source=source)
            PesapalService._fire_post_payment(payment.order_id)
            return "completed"

        if raw_status in {"FAILED", "REVERSED", "INVALID"}:
            with transaction.atomic():
                p = Payment.objects.select_for_update().get(pk=payment.pk)
                if p.status == "completed":
                    return "completed"
                p.status = "failed"
                p.raw_callback = status_resp
                p.callback_received_at = timezone.now()
                p.save(update_fields=["status", "raw_callback_json", "callback_received_at", "updated_at"])
                order = p.order
                order.status = "payment_failed"
                order.save(update_fields=["status", "updated_at"])
            metrics.incr("payments.failed")
            audit_log(event_type="ipn_failed", payload=status_resp, payment=payment, source=source)
            return "failed"

        # PENDING / unknown — leave as initiated, let polling/IPN re-attempt.
        audit_log(event_type="ipn_received", payload=status_resp, payment=payment, source=source)
        return payment.status

    @staticmethod
    def _fire_post_payment(order_id):
        try:
            from apps.orders.tasks import generate_invoice, send_payment_confirmation, reduce_inventory

            for task in (reduce_inventory, generate_invoice, send_payment_confirmation):
                try:
                    task.delay(order_id)
                except Exception as exc:
                    logger.warning("Pesapal post-payment task %s failed to enqueue: %s", task.__name__, exc)
        except Exception as exc:
            logger.error("Failed to trigger Pesapal post-payment tasks for order %s: %s", order_id, exc)


def _cache_get(key):
    try:
        from django.core.cache import cache

        return cache.get(key)
    except Exception:
        return None


def _cache_set(key, value, timeout):
    try:
        from django.core.cache import cache

        cache.set(key, value, timeout=timeout)
    except Exception:
        pass
