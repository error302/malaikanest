import base64
from datetime import timedelta
from zoneinfo import ZoneInfo
import hashlib
import json
import logging
import os
from uuid import uuid4

import requests
from decimal import Decimal, ROUND_HALF_UP
from django.core.cache import cache
from django.conf import settings

from django.db import transaction
from django.utils import timezone
from apps.orders.models import Order
from apps.core.circuit_breaker import call_with_breaker, CircuitOpen
from .models import Payment, PaymentAuditLog
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger("apps.payments")

def format_mpesa_amount(amount):
    return str(Decimal(amount).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def payload_hash(payload):
    serialized = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def make_json_serializable(payload):
    return json.loads(json.dumps(payload, sort_keys=True, default=str))


def audit_log(
    event_type,
    payload,
    payment=None,
    request_ip=None,
    checkout_request_id=None,
    merchant_request_id=None,
    result_code=None,
    notes="",
    source="api",
):
    safe_payload = make_json_serializable(payload)
    try:
        PaymentAuditLog.objects.create(
            payment=payment,
            event_type=event_type,
            source=source,
            request_ip=request_ip,
            checkout_request_id=checkout_request_id,
            merchant_request_id=merchant_request_id,
            result_code=str(result_code) if result_code is not None else None,
            payload_hash=payload_hash(safe_payload),
            payload=safe_payload,
            notes=notes,
        )
    except Exception as exc:
        logger.warning("payment audit log write skipped: %s", exc)


import re


def normalize_phone(phone):
    """
    Normalize a phone number to Safaricom format (254XXXXXXXXX, no + prefix).

    This format is required by Safaricom's M-Pesa STK push API.
    For the +254... variant used by model validators, see
    apps.accounts.models.normalize_kenyan_phone.

    Raises:
        ValueError: If phone number is not a valid Kenyan mobile number.
    """
    if not phone:
        return ""

    p = str(phone).replace("+254", "254").replace(" ", "").replace("-", "")

    if p.startswith("0"):
        p = "254" + p[1:]
    elif not p.startswith("254"):
        p = "254" + p

    if not re.match(r'^254[17]\d{8}$', p):
        raise ValueError(
            "Invalid Kenyan phone number. "
            "Expected format: +2547XXXXXXXX, 07XXXXXXXX, or 7XXXXXXXX."
        )

    return p


def is_placeholder_secret(value):
    if value is None:
        return True
    normalized = str(value).strip().lower()
    if not normalized:
        return True
    placeholder_tokens = (
        "changeme",
        "change-me",
        "placeholder",
        "replace_me",
        "replace-me",
        "example",
        "dummy",
        "your-",
        "your_",
        "default",
        "sample",
        "test",
    )
    return any(token in normalized for token in placeholder_tokens)


class StkInitiationUncertain(ValueError):
    """Daraja may have accepted a prompt even though its response did not arrive."""


class PaymentService:
    @staticmethod
    def _broadcast_payment_update(order_id, status, receipt=None):
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f'payment_{order_id}',
                    {
                        'type': 'payment_update',
                        'payload': {'status': status, 'receipt': receipt}
                    }
                )
        except Exception as e:
            logger.error("Failed to broadcast payment update for order %s: %s", order_id, e)

    @staticmethod
    def should_use_mock_mpesa():
        explicit = os.getenv("MPESA_MOCK_MODE")
        if explicit is not None:
            return explicit.strip().lower() in {"1", "true", "yes", "on"}
        return bool(settings.DEBUG)

    @staticmethod
    def _mpesa_env() -> str:
        env = (os.getenv("MPESA_ENV", "sandbox") or "sandbox").strip().lower()
        return "live" if env in {"live", "production", "prod"} else "sandbox"

    @staticmethod
    def _mpesa_token_url() -> str:
        return (
            "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
            if PaymentService._mpesa_env() == "live"
            else "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        )

    @staticmethod
    def _mpesa_stk_url() -> str:
        return (
            "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
            if PaymentService._mpesa_env() == "live"
            else "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        )

    @staticmethod
    def get_mpesa_oauth_token() -> str:
        consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        if not consumer_key or not consumer_secret:
            raise ValueError("M-Pesa credentials missing")

        cache_key = f"mpesa:oauth:{PaymentService._mpesa_env()}"
        cached = cache.get(cache_key)
        if cached:
            return str(cached)

        token_resp = call_with_breaker(
            "mpesa_oauth",
            lambda: requests.get(
                PaymentService._mpesa_token_url(),
                auth=(consumer_key, consumer_secret),
                timeout=(5, 10),
                allow_redirects=False,
            ),
        )
        if token_resp.status_code != 200:
            raise ValueError("M-Pesa authentication failed")
        token = token_resp.json().get("access_token")
        if not token:
            raise ValueError("M-Pesa authentication failed")

        # Safaricom tokens are typically valid for 1 hour; cache for 55 minutes.
        cache.set(cache_key, token, timeout=55 * 60)
        return str(token)

    @staticmethod
    def enqueue_task(task, *args, **kwargs):
        try:
            return task.delay(*args, **kwargs)
        except Exception as exc:
            logger.warning("Falling back to synchronous task execution for %s: %s", getattr(task, "__name__", task), exc)
            try:
                return task(*args, **kwargs)
            except Exception as sync_exc:
                logger.error(
                    "Synchronous fallback failed for %s: %s",
                    getattr(task, "__name__", task),
                    sync_exc,
                )
                return None

    @staticmethod
    def trigger_post_payment_tasks(order_id):
        try:
            from apps.orders.tasks import generate_invoice, send_payment_confirmation, reduce_inventory

            PaymentService.enqueue_task(reduce_inventory, order_id)
            PaymentService.enqueue_task(generate_invoice, order_id)
            PaymentService.enqueue_task(send_payment_confirmation, order_id)
        except Exception as exc:
            logger.error("Failed to trigger invoice/email tasks for order %s: %s", order_id, exc)

    @staticmethod
    def complete_mock_mpesa_payment(payment, phone):
        receipt = f"MOCK{uuid4().hex[:10].upper()}"
        checkout_request_id = payment.checkout_request_id or f"mock-{uuid4().hex}"

        with transaction.atomic():
            p = Payment.objects.select_for_update().get(pk=payment.pk)
            p.phone = phone
            p.checkout_request_id = checkout_request_id
            p.mpesa_receipt_number = receipt
            p.status = "completed"
            p.raw_callback = {"mock": True, "receipt": receipt}
            p.completed_at = timezone.now()
            p.callback_received_at = timezone.now()
            p.save(update_fields=["phone_number", "mpesa_checkout_request_id", "mpesa_receipt_number", "status", "raw_callback_json", "completed_at", "callback_received_at", "updated_at"])

            order = p.order
            order.status = "paid"
            order.payment_method = "mpesa"
            order.mpesa_receipt_number = receipt
            order.transaction_id = receipt
            order.paid_at = timezone.now()
            order.save(update_fields=["status", "payment_method", "mpesa_receipt_number", "transaction_id", "paid_at", "updated_at"])

        audit_log(
            event_type="reconcile_completed",
            payload={"mock": True, "payment_id": payment.id, "order_id": payment.order_id},
            payment=payment,
            checkout_request_id=checkout_request_id,
            result_code="0",
            notes="Mock M-Pesa payment completed in development mode",
        )
        PaymentService.trigger_post_payment_tasks(payment.order_id)
        PaymentService._broadcast_payment_update(payment.order_id, "completed", receipt)
        return checkout_request_id

    @staticmethod
    def initiate_mpesa_stk(payment, phone):
        consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        shortcode = os.getenv("MPESA_SHORTCODE") or os.getenv("MPESA_BUSINESS_SHORT_CODE", "3104615")
        till_number = (os.getenv("MPESA_TILL_NUMBER") or "3370347").strip()
        passkey = os.getenv("MPESA_PASSKEY")
        callback_url = os.getenv("MPESA_CALLBACK_URL")
        mpesa_env = PaymentService._mpesa_env()
        transaction_type = os.getenv("MPESA_TRANSACTION_TYPE") or ("CustomerBuyGoodsOnline" if till_number else "CustomerPayBillOnline")
        party_b = till_number if till_number else shortcode

        mpesa_values = [consumer_key, consumer_secret, passkey, callback_url, shortcode]
        mpesa_configured = all(mpesa_values) and not any(
            is_placeholder_secret(value) for value in mpesa_values
        )

        if not mpesa_configured:
            if PaymentService.should_use_mock_mpesa():
                return PaymentService.complete_mock_mpesa_payment(payment, phone)
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            raise ValueError("M-Pesa not configured")

        if mpesa_env == "live" and ("localhost" in callback_url or not callback_url.startswith("https://")):
            raise ValueError("M-Pesa callback URL is not valid for production")

        from .mpesa_verification import code, identifier

        phone = normalize_phone(phone)
        if not phone or len(phone) != 12 or not phone.startswith(("2547", "2541")) or not phone.isdigit():
            raise ValueError("Enter a valid M-Pesa phone number.")

        with transaction.atomic():
            payment = Payment.objects.select_for_update().get(pk=payment.pk)
            order = Order.objects.select_for_update().get(pk=payment.order_id)
            if payment.payment_method != "mpesa" or order.status not in (Order.STATUS_PENDING, Order.STATUS_INITIATED):
                raise ValueError("This order is not awaiting M-Pesa.")
            if payment.status != "initiated" or payment.amount != order.total:
                raise ValueError("This order needs a payment review.")
            if payment.checkout_request_id:
                if payment.phone_number == phone:
                    return payment.checkout_request_id
                raise ValueError("An M-Pesa request is already active for this order.")
            if payment.mpesa_issue:
                raise StkInitiationUncertain("An M-Pesa request may already be active.")
            sent_amount = int(format_mpesa_amount(order.total))
            if sent_amount < 1:
                raise ValueError("The order must total at least KSh 1.")
            payment.phone_number = phone
            payment.mpesa_sent_amount = sent_amount
            payment.mpesa_shortcode = shortcode
            payment.mpesa_destination = party_b
            # Persist before the non-idempotent provider call. If its response is
            # lost, do not send a second prompt or offer a second payment.
            payment.mpesa_issue = "initiation_unknown"
            payment.initiated_at = timezone.now()
            payment.save(update_fields=[
                "phone_number", "mpesa_sent_amount", "mpesa_shortcode", "mpesa_destination",
                "mpesa_issue", "initiated_at", "updated_at",
            ])

        try:
            access_token = PaymentService.get_mpesa_oauth_token()
        except (requests.RequestException, CircuitOpen, ValueError):
            Payment.objects.filter(pk=payment.pk).update(mpesa_issue="")
            raise ValueError("M-Pesa is temporarily unavailable.")

        timestamp = timezone.now().astimezone(ZoneInfo("Africa/Nairobi")).strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()
        payload = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": transaction_type,
            "Amount": sent_amount,
            "PartyA": phone,
            "PartyB": party_b,
            "PhoneNumber": phone,
            "CallBackURL": callback_url,
            "AccountReference": f"MN{payment.order_id.hex[-10:]}",
            "TransactionDesc": "Malaika Nest Order",
        }
        try:
            response = call_with_breaker(
                "mpesa_api",
                lambda: requests.post(
                    PaymentService._mpesa_stk_url(),
                    json=payload,
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=(5, 12),
                    allow_redirects=False,
                ),
            )
            result = response.json()
        except (requests.RequestException, CircuitOpen, ValueError):
            raise StkInitiationUncertain("M-Pesa has not confirmed whether the prompt was sent.")

        if isinstance(result, dict) and response.status_code == 200:
            checkout_id = result.get("CheckoutRequestID")
            merchant_id = result.get("MerchantRequestID")
            if code(result.get("ResponseCode")) == "0" and identifier(checkout_id) and identifier(merchant_id):
                Payment.objects.filter(pk=payment.pk).update(
                    mpesa_checkout_request_id=checkout_id,
                    mpesa_merchant_request_id=merchant_id,
                    mpesa_next_query_at=timezone.now() + timedelta(seconds=75),
                    mpesa_issue="",
                    updated_at=timezone.now(),
                )
                return checkout_id
            if code(result.get("ResponseCode")) not in (None, "0"):
                Payment.objects.filter(pk=payment.pk).update(mpesa_issue="", status="failed")
                raise ValueError("Safaricom declined the M-Pesa request.")
        raise StkInitiationUncertain("M-Pesa has not confirmed whether the prompt was sent.")
