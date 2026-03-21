import base64
import datetime
import hashlib
import json
import logging
import os
import ipaddress
from collections.abc import Mapping
from uuid import uuid4

import requests
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from apps.orders.models import Order
from .models import Payment, PaymentAuditLog
from .tasks import verify_mpesa_payment_async

logger = logging.getLogger("apps.payments")

MPESA_SAFARICOM_IPS = {
    "196.201.214.0/24",
    "196.201.213.0/24",
    "41.89.0.0/16",
    "41.86.0.0/16",
}


def is_valid_mpesa_ip(ip):
    if not ip:
        return False
    for net in MPESA_SAFARICOM_IPS:
        try:
            if ipaddress.ip_address(ip) in ipaddress.ip_network(net):
                return True
        except ValueError:
            continue
    return False


def format_mpesa_amount(amount):
    return str(Decimal(amount).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def payload_hash(payload):
    serialized = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


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
    try:
        PaymentAuditLog.objects.create(
            payment=payment,
            event_type=event_type,
            source=source,
            request_ip=request_ip,
            checkout_request_id=checkout_request_id,
            merchant_request_id=merchant_request_id,
            result_code=str(result_code) if result_code is not None else None,
            payload_hash=payload_hash(payload),
            payload=payload,
            notes=notes,
        )
    except Exception as exc:
        logger.warning("payment audit log write skipped: %s", exc)


def normalize_phone(phone):
    if not phone:
        return ""
    p = str(phone).replace("+254", "254").replace(" ", "").replace("-", "")
    if p.startswith("0"):
        p = "254" + p[1:]
    elif not p.startswith("254"):
        p = "254" + p
    return p


def pick(data, *keys):
    if not isinstance(data, dict):
        return None
    for key in keys:
        if key in data:
            return data.get(key)
    return None


def _coerce_json_object(value):
    """
    Safaricom callbacks sometimes arrive with nested objects encoded as JSON strings
    (e.g. from form-encoded payloads). Accept dicts as-is and best-effort parse strings.
    """
    if isinstance(value, dict):
        return value
    # DRF may provide QueryDict/ReturnDict or other Mapping types.
    if isinstance(value, Mapping):
        if hasattr(value, "dict"):
            try:
                return value.dict()
            except Exception:
                pass
        try:
            return dict(value)
        except Exception:
            return {}
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except Exception:
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


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


class PaymentService:
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

        token_resp = requests.get(
            PaymentService._mpesa_token_url(),
            auth=(consumer_key, consumer_secret),
            timeout=30,
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
    def _request_with_retries(method, url, *, attempts=3, backoff_seconds=1, **kwargs):
        last_exc = None
        for attempt in range(1, attempts + 1):
            try:
                resp = requests.request(method, url, timeout=30, **kwargs)
                return resp
            except Exception as exc:
                last_exc = exc
                if attempt == attempts:
                    break
                try:
                    import time

                    time.sleep(backoff_seconds * (2 ** (attempt - 1)))
                except Exception:
                    pass
        raise last_exc

    @staticmethod
    def enqueue_task(task, *args, **kwargs):
        try:
            return task.delay(*args, **kwargs)
        except Exception as exc:
            logger.warning("Falling back to synchronous task execution for %s: %s", getattr(task, "__name__", task), exc)
            return task(*args, **kwargs)

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
        return checkout_request_id

    @staticmethod
    def initiate_mpesa_stk(payment, phone):
        consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        shortcode = os.getenv("MPESA_SHORTCODE") or os.getenv("MPESA_BUSINESS_SHORT_CODE", "174379")
        passkey = os.getenv("MPESA_PASSKEY")
        callback_url = os.getenv("MPESA_CALLBACK_URL")
        mpesa_env = PaymentService._mpesa_env()

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

        # Idempotency: if an initiated payment already has a CheckoutRequestID for the same phone, reuse it.
        if payment.status == "initiated" and payment.checkout_request_id and normalize_phone(payment.phone or "") == normalize_phone(phone):
            return payment.checkout_request_id

        try:
            access_token = PaymentService.get_mpesa_oauth_token()
        except Exception as exc:
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            logger.error("M-Pesa auth exception: %s", str(exc))
            raise ValueError("M-Pesa service unavailable")

        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()
        stk_url = PaymentService._mpesa_stk_url()

        payload = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": format_mpesa_amount(payment.amount),
            "PartyA": phone,
            "PartyB": shortcode,
            "PhoneNumber": phone,
            "CallBackURL": callback_url,
            "AccountReference": f"MalaikaNest-{payment.order.id}",
            "TransactionDesc": "Malaika Nest Order Payment",
        }

        try:
            resp = PaymentService._request_with_retries(
                "POST",
                stk_url,
                attempts=3,
                backoff_seconds=1,
                json=payload,
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            )
            result = resp.json()

            if resp.status_code == 200 and result.get("ResponseCode") == "0":
                checkout_request_id = result.get("CheckoutRequestID")
                payment.checkout_request_id = checkout_request_id
                payment.phone = phone
                payment.save(update_fields=["mpesa_checkout_request_id", "phone_number", "updated_at"])

                audit_log(
                    event_type="stk_initiated",
                    payload={"request": {**payload, "Password": "***"}, "response": result},
                    payment=payment,
                    checkout_request_id=checkout_request_id,
                    notes="STK push initiated successfully",
                )
                PaymentService.enqueue_task(verify_mpesa_payment_async, payment.id)
                return checkout_request_id

            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            audit_log(
                event_type="stk_failed",
                payload={"request": {**payload, "Password": "***"}, "response": result},
                payment=payment,
                result_code=result.get("ResponseCode"),
                notes=result.get("ResponseDescription", "STK push failed"),
            )
            raise ValueError(result.get("ResponseDescription", "STK push failed"))

        except ValueError:
            raise
        except Exception as exc:
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            audit_log(
                event_type="stk_failed",
                payload={"request": {**payload, "Password": "***"}, "exception": str(exc)},
                payment=payment,
                notes="Exception during STK push",
            )
            raise ValueError("M-Pesa service error")

    @staticmethod
    def process_callback(raw, client_ip):
        raw = _coerce_json_object(raw)
        body = _coerce_json_object(pick(raw, "Body", "body"))
        callback_result = _coerce_json_object(pick(body, "stkCallback", "stkcallback", "stk_callback"))
        checkout_id = pick(callback_result, "CheckoutRequestID", "checkoutRequestID", "checkout_request_id")
        merchant_request_id = pick(callback_result, "MerchantRequestID", "merchantRequestID", "merchant_request_id")
        result_code = pick(callback_result, "ResultCode", "resultCode", "result_code")

        audit_log(event_type="callback_received", payload=raw, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code)

        with transaction.atomic():
            payment = None
            if checkout_id:
                payment = (
                    Payment.objects.select_for_update()
                    .select_related("order", "order__user")
                    .filter(mpesa_checkout_request_id=checkout_id)
                    .first()
                )
            if not payment and merchant_request_id:
                payment = (
                    Payment.objects.select_for_update()
                    .select_related("order", "order__user")
                    .filter(order__receipt_number=merchant_request_id)
                    .first()
                )

            if not payment:
                audit_log(event_type="callback_unmatched", payload=raw, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, notes="No matching payment")
                return {"ResultCode": 0, "ResultDesc": "Accepted"}

            if payment.status == "completed":
                payment.raw_callback = raw
                payment.callback_received_at = timezone.now()
                payment.save(update_fields=["raw_callback_json", "callback_received_at", "updated_at"])
                audit_log(event_type="callback_duplicate", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code)
                return {"ResultCode": 0, "ResultDesc": "Accepted"}

            payment.raw_callback = raw
            callback_metadata = _coerce_json_object(pick(callback_result, "CallbackMetadata", "callbackMetadata", "callback_metadata"))

            if str(result_code) == "0":
                callback_items = pick(callback_metadata, "Item", "item") or []
                items = {it.get("Name") or it.get("name"): it.get("Value") or it.get("value") for it in callback_items}
                receipt = items.get("MpesaReceiptNumber")
                amount = items.get("Amount")
                callback_phone = items.get("PhoneNumber")

                try:
                    if Decimal(str(amount)) != payment.amount:
                        payment.status = "failed"
                        payment.save(update_fields=["status", "updated_at"])
                        try:
                            order = payment.order
                            if hasattr(order, "transition_to") and hasattr(Order, "STATUS_PAYMENT_FAILED"):
                                order.transition_to(Order.STATUS_PAYMENT_FAILED)
                            else:
                                order.status = "payment_failed"
                                order.save(update_fields=["status", "updated_at"])

                            from apps.orders.tasks import restore_inventory

                            transaction.on_commit(lambda: PaymentService.enqueue_task(restore_inventory, order.id))
                        except Exception:
                            pass
                        audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code="AMOUNT_MISMATCH", notes=f"Expected {payment.amount}, got {amount}")
                        return {"ResultCode": 1, "ResultDesc": "Amount mismatch"}
                except (InvalidOperation, TypeError):
                    payment.status = "failed"
                    payment.save(update_fields=["status", "updated_at"])
                    audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code="INVALID_AMOUNT")
                    return {"ResultCode": 1, "ResultDesc": "Invalid amount"}

                order_phone = payment.phone or (
                    payment.order.user.phone_number
                    if payment.order.user and hasattr(payment.order.user, "phone_number")
                    else None
                )
                if order_phone and callback_phone and normalize_phone(order_phone) != normalize_phone(callback_phone):
                    payment.status = "failed"
                    payment.callback_received_at = timezone.now()
                    payment.save(update_fields=["status", "raw_callback_json", "callback_received_at", "updated_at"])
                    try:
                        order = payment.order
                        if hasattr(order, "transition_to") and hasattr(Order, "STATUS_PAYMENT_FAILED"):
                            order.transition_to(Order.STATUS_PAYMENT_FAILED)
                        else:
                            order.status = "payment_failed"
                            order.save(update_fields=["status", "updated_at"])

                        from apps.orders.tasks import restore_inventory

                        transaction.on_commit(lambda: PaymentService.enqueue_task(restore_inventory, order.id))
                    except Exception:
                        pass
                    audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code="PHONE_MISMATCH")
                    return {"ResultCode": 1, "ResultDesc": "Phone mismatch"}

                if receipt and Payment.objects.filter(mpesa_receipt_number=receipt).exclude(pk=payment.pk).exists():
                    audit_log(event_type="callback_duplicate_receipt", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code, notes="Receipt already processed")
                    return {"ResultCode": 0, "ResultDesc": "Accepted"}

                payment.mpesa_receipt_number = receipt
                payment.phone = callback_phone
                payment.status = "completed"
                payment.callback_received_at = timezone.now()
                payment.completed_at = timezone.now()
                payment.save(update_fields=["mpesa_receipt_number", "phone_number", "status", "raw_callback_json", "callback_received_at", "completed_at", "updated_at"])

                order = payment.order
                try:
                    if hasattr(order, "transition_to") and hasattr(Order, "STATUS_PAID"):
                        ok, _err = order.transition_to(Order.STATUS_PAID)
                        if not ok:
                            order.status = "paid"
                            if hasattr(order, "paid_at"):
                                order.paid_at = timezone.now()
                            order.save(update_fields=["status", "paid_at", "updated_at"] if hasattr(order, "paid_at") else ["status", "updated_at"])
                    else:
                        order.status = "paid"
                        if hasattr(order, "paid_at"):
                            order.paid_at = timezone.now()
                            order.save(update_fields=["status", "paid_at", "updated_at"])
                        else:
                            order.save(update_fields=["status", "updated_at"])
                except Exception as e:
                    logger.error("Order status update failed for order %s: %s", order.id, e)

                transaction.on_commit(lambda: PaymentService.trigger_post_payment_tasks(order.id))

                audit_log(event_type="callback_completed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code)
                return {"ResultCode": 0, "ResultDesc": "Accepted"}

            result_desc = callback_result.get("ResultDesc", "Unknown error")
            payment.status = "failed"
            payment.callback_received_at = timezone.now()
            payment.save(update_fields=["status", "raw_callback_json", "callback_received_at", "updated_at"])
            try:
                order = payment.order
                if hasattr(order, "transition_to") and hasattr(Order, "STATUS_PAYMENT_FAILED"):
                    order.transition_to(Order.STATUS_PAYMENT_FAILED)
                else:
                    order.status = "payment_failed"
                    order.save(update_fields=["status", "updated_at"])
            except Exception as e:
                logger.error("Order status update failed for order %s: %s", payment.order_id, e)

            try:
                from apps.orders.tasks import restore_inventory

                transaction.on_commit(lambda: PaymentService.enqueue_task(restore_inventory, payment.order_id))
            except Exception:
                pass
            audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code, notes=result_desc)
            return {"ResultCode": 0, "ResultDesc": "Accepted"}






