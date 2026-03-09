import base64
import datetime
import hashlib
import json
import logging
import os
import ipaddress
from uuid import uuid4

import requests
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.conf import settings
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
    def enqueue_task(task, *args, **kwargs):
        try:
            return task.delay(*args, **kwargs)
        except Exception as exc:
            logger.warning("Falling back to synchronous task execution for %s: %s", getattr(task, "__name__", task), exc)
            return task(*args, **kwargs)

    @staticmethod
    def trigger_post_payment_tasks(order_id):
        try:
            from apps.orders.tasks import generate_invoice, send_payment_confirmation

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
            p.save(update_fields=["phone", "checkout_request_id", "mpesa_receipt_number", "status", "raw_callback", "updated_at"])

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
        business_short_code = os.getenv("MPESA_BUSINESS_SHORT_CODE", "174379")
        till_number = os.getenv("MPESA_TILL_NUMBER", business_short_code)
        store_number = os.getenv("MPESA_STORE_NUMBER", business_short_code)
        passkey = os.getenv("MPESA_PASSKEY")
        callback_url = os.getenv("MPESA_CALLBACK_URL")
        mpesa_env = os.getenv("MPESA_ENV", "sandbox")

        mpesa_values = [consumer_key, consumer_secret, passkey, callback_url]
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

        token_url = (
            "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
            if mpesa_env == "live"
            else "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        )

        try:
            token_resp = requests.get(token_url, auth=(consumer_key, consumer_secret), timeout=30)
            if token_resp.status_code != 200:
                payment.status = "failed"
                payment.save(update_fields=["status", "updated_at"])
                raise ValueError("M-Pesa authentication failed")
            access_token = token_resp.json().get("access_token")
        except Exception as exc:
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            logger.error("M-Pesa auth exception: %s", str(exc))
            raise ValueError("M-Pesa service unavailable")

        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(f"{business_short_code}{passkey}{timestamp}".encode()).decode()

        stk_url = (
            "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
            if mpesa_env == "live"
            else "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        )

        payload = {
            "BusinessShortCode": store_number,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerBuyGoodsOnline",
            "Amount": format_mpesa_amount(payment.amount),
            "PartyA": phone,
            "PartyB": till_number,
            "PhoneNumber": phone,
            "CallBackURL": callback_url,
            "AccountReference": f"MalaikaNest-{payment.order.id}",
            "TransactionDesc": "Malaika Nest Order Payment",
        }

        try:
            resp = requests.post(stk_url, json=payload, headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}, timeout=30)
            result = resp.json()

            if resp.status_code == 200 and result.get("ResponseCode") == "0":
                checkout_request_id = result.get("CheckoutRequestID")
                payment.checkout_request_id = checkout_request_id
                payment.phone = phone
                payment.save(update_fields=["checkout_request_id", "phone", "updated_at"])

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
        body = pick(raw, "Body", "body") or {}
        callback_result = pick(body, "stkCallback", "stkcallback", "stk_callback") or {}
        checkout_id = pick(callback_result, "CheckoutRequestID", "checkoutRequestID", "checkout_request_id")
        merchant_request_id = pick(callback_result, "MerchantRequestID", "merchantRequestID", "merchant_request_id")
        result_code = pick(callback_result, "ResultCode", "resultCode", "result_code")

        audit_log(event_type="callback_received", payload=raw, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code)

        with transaction.atomic():
            payment = None
            if checkout_id:
                payment = Payment.objects.select_for_update().filter(checkout_request_id=checkout_id).first()
            if not payment and merchant_request_id:
                payment = Payment.objects.select_for_update().filter(order__receipt_number=merchant_request_id).first()

            if not payment:
                audit_log(event_type="callback_unmatched", payload=raw, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, notes="No matching payment")
                return {"ResultCode": 0, "ResultDesc": "Accepted"}

            if payment.status == "completed":
                payment.raw_callback = raw
                payment.save(update_fields=["raw_callback", "updated_at"])
                audit_log(event_type="callback_duplicate", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code)
                return {"ResultCode": 0, "ResultDesc": "Accepted"}

            payment.raw_callback = raw
            callback_metadata = pick(callback_result, "CallbackMetadata", "callbackMetadata", "callback_metadata") or {}

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
                        audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code="AMOUNT_MISMATCH", notes=f"Expected {payment.amount}, got {amount}")
                        return {"ResultCode": 1, "ResultDesc": "Amount mismatch"}
                except (InvalidOperation, TypeError):
                    payment.status = "failed"
                    payment.save(update_fields=["status", "updated_at"])
                    audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code="INVALID_AMOUNT")
                    return {"ResultCode": 1, "ResultDesc": "Invalid amount"}

                order_phone = payment.phone or (payment.order.user.phone if payment.order.user and hasattr(payment.order.user, "phone") else None)
                if order_phone and callback_phone and normalize_phone(order_phone) != normalize_phone(callback_phone):
                    payment.status = "failed"
                    payment.save(update_fields=["status", "raw_callback", "updated_at"])
                    audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code="PHONE_MISMATCH")
                    return {"ResultCode": 1, "ResultDesc": "Phone mismatch"}

                if receipt and Payment.objects.filter(mpesa_receipt_number=receipt).exclude(pk=payment.pk).exists():
                    audit_log(event_type="callback_duplicate_receipt", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code, notes="Receipt already processed")
                    return {"ResultCode": 0, "ResultDesc": "Accepted"}

                payment.mpesa_receipt_number = receipt
                payment.phone = callback_phone
                payment.status = "completed"
                payment.save(update_fields=["mpesa_receipt_number", "phone", "status", "raw_callback", "updated_at"])

                order = payment.order
                order.status = "paid"
                if hasattr(order, "paid_at"):
                    order.paid_at = timezone.now()
                    order.save(update_fields=["status", "paid_at", "updated_at"])
                else:
                    order.save(update_fields=["status", "updated_at"])

                try:
                    PaymentService.trigger_post_payment_tasks(order.id)
                except Exception as e:
                    logger.error(f"Failed to trigger invoice/email tasks for order {order.id}: {e}")

                audit_log(event_type="callback_completed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code)
                return {"ResultCode": 0, "ResultDesc": "Accepted"}

            result_desc = callback_result.get("ResultDesc", "Unknown error")
            payment.status = "failed"
            payment.save(update_fields=["status", "raw_callback", "updated_at"])
            payment.order.status = "payment_failed"
            payment.order.save(update_fields=["status", "updated_at"])
            audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code, notes=result_desc)
            return {"ResultCode": 0, "ResultDesc": "Accepted"}






