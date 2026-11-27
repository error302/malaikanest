import base64
import re
import os
from datetime import timedelta
from decimal import Decimal, InvalidOperation
from zoneinfo import ZoneInfo

import requests
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.core.circuit_breaker import CircuitOpen, call_with_breaker
from apps.orders.models import Order
from apps.orders.services import OrderService
from apps.core.outbox import publish_event
from .models import Payment
from .services import PaymentService, format_mpesa_amount, normalize_phone

MAX_ATTEMPTS = 12
IDENTIFIER = re.compile(r"[A-Za-z0-9_-]{1,128}")
RECEIPT = re.compile(r"[A-Z0-9]{8,20}")
RESULT_CODE = re.compile(r"[0-9]{1,8}")
FAILURE_CODES = {"1", "1037", "1038", "2001"}
CANCEL_CODE = "1032"


def identifier(value):
    return isinstance(value, str) and bool(IDENTIFIER.fullmatch(value))


def code(value):
    if type(value) in (str, int) and RESULT_CODE.fullmatch(str(value)):
        return str(value)
    return None


def amount(value):
    if type(value) not in (int, str, float):
        return None
    try:
        parsed = Decimal(str(value))
        if parsed.is_finite() and 0 < parsed <= 9999999999 and parsed == parsed.to_integral_value():
            return int(parsed)
    except InvalidOperation:
        pass
    return None


def receipt_number(value):
    if isinstance(value, str) and RECEIPT.fullmatch(value):
        return value
    return None


def queue_callback(payload):
    """Record bounded advisory metadata and schedule one durable query per payment."""
    body = payload.get("Body") if isinstance(payload, dict) else None
    callback = body.get("stkCallback") if isinstance(body, dict) else None
    if not isinstance(callback, dict):
        raise ValueError("Invalid callback")

    checkout_id = callback.get("CheckoutRequestID")
    merchant_id = callback.get("MerchantRequestID")
    result = code(callback.get("ResultCode"))
    if not identifier(checkout_id) or not identifier(merchant_id) or result is None:
        raise ValueError("Invalid callback")

    metadata = callback.get("CallbackMetadata", {})
    items = metadata.get("Item", []) if isinstance(metadata, dict) else None
    if not isinstance(items, list) or len(items) > 12:
        raise ValueError("Invalid callback metadata")
    fields = {}
    for item in items:
        name = item.get("Name") if isinstance(item, dict) else None
        if not identifier(name) or name in fields:
            raise ValueError("Invalid callback metadata")
        fields[name] = item.get("Value")

    with transaction.atomic():
        payment = Payment.objects.select_for_update().filter(
            payment_method="mpesa", mpesa_checkout_request_id=checkout_id,
        ).first()
        if not payment or payment.callback_received_at:
            return
        if payment.mpesa_merchant_request_id and payment.mpesa_merchant_request_id != merchant_id:
            return

        summary = {"result": result}
        if result == "0":
            claimed_receipt = receipt_number(fields.get("MpesaReceiptNumber"))
            claimed_amount = amount(fields.get("Amount"))
            raw_phone = fields.get("PhoneNumber")
            try:
                phone = normalize_phone(str(raw_phone)) if type(raw_phone) in (int, str) else None
            except ValueError:
                phone = None
            expected_amount = payment.mpesa_sent_amount or int(format_mpesa_amount(payment.amount))
            if (claimed_amount == expected_amount and claimed_receipt and phone
                    and phone == (payment.phone_number or "").lstrip("+")):
                summary.update(receipt=claimed_receipt, amount=claimed_amount)
            else:
                summary["issue"] = "callback_metadata_mismatch"
        payment.callback_received_at = timezone.now()
        payment.mpesa_callback_summary = summary
        if (payment.status == "initiated" and payment.mpesa_query_attempts < MAX_ATTEMPTS
                and not payment.mpesa_query_lease_until):
            payment.mpesa_next_query_at = payment.callback_received_at
        payment.save(update_fields=[
            "callback_received_at", "mpesa_callback_summary", "mpesa_next_query_at", "updated_at",
        ])


def query_provider(payment):
    shortcode = payment.mpesa_shortcode or os.getenv("MPESA_SHORTCODE") or os.getenv("MPESA_BUSINESS_SHORT_CODE")
    passkey = os.getenv("MPESA_PASSKEY")
    if not shortcode or not passkey:
        raise ValueError("M-Pesa configuration unavailable")
    timestamp = timezone.now().astimezone(ZoneInfo("Africa/Nairobi")).strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()
    token = PaymentService.get_mpesa_oauth_token()
    host = "api" if PaymentService._mpesa_env() == "live" else "sandbox"
    response = call_with_breaker(
        "mpesa_api",
        lambda: requests.post(
            f"https://{host}.safaricom.co.ke/mpesa/stkpushquery/v1/query",
            json={
                "BusinessShortCode": shortcode, "CheckoutRequestID": payment.checkout_request_id,
                "Password": password, "Timestamp": timestamp,
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=(5, 12),
            allow_redirects=False,
        ),
    )
    if response.status_code != 200:
        return None
    data = response.json()
    return data if isinstance(data, dict) else None


def schedule_verification(payments):
    """Queue eligible M-Pesa payments without bypassing retries or a live lease."""
    return payments.filter(
        payment_method="mpesa", status="initiated", mpesa_next_query_at__isnull=True,
        mpesa_query_attempts__lt=MAX_ATTEMPTS, mpesa_query_lease_until__isnull=True,
    ).exclude(mpesa_checkout_request_id__isnull=True).exclude(
        mpesa_checkout_request_id="",
    ).update(mpesa_next_query_at=timezone.now())


def verify_payment(payment_id):
    """Claim a query across workers, call Daraja outside the transaction, then apply its result."""
    now = timezone.now()
    lease = now + timedelta(seconds=90)
    with transaction.atomic():
        payment = Payment.objects.select_for_update().filter(
            pk=payment_id, payment_method="mpesa",
        ).first()
        if not payment or not payment.checkout_request_id:
            return "no checkout request"
        if payment.status != "initiated":
            return "already completed" if payment.status == "completed" else payment.status
        if payment.mpesa_query_lease_until and payment.mpesa_query_lease_until > now:
            return "query in progress"
        if payment.mpesa_next_query_at and payment.mpesa_next_query_at > now:
            return "waiting for retry"
        if payment.mpesa_query_attempts >= MAX_ATTEMPTS:
            if payment.mpesa_next_query_at:
                payment.mpesa_issue = payment.mpesa_issue or "query_attempts_exhausted"
                payment.mpesa_next_query_at = None
                payment.save(update_fields=["mpesa_issue", "mpesa_next_query_at", "updated_at"])
            return "needs review"
        payment.mpesa_query_attempts += 1
        payment.mpesa_query_lease_until = lease
        # Keep crashed jobs visible to the worker at lease expiry.
        payment.mpesa_next_query_at = lease
        payment.save(update_fields=[
            "mpesa_query_attempts", "mpesa_query_lease_until", "mpesa_next_query_at", "updated_at",
        ])

    try:
        data = query_provider(payment)
    except (ValueError, requests.RequestException, CircuitOpen):
        data = None

    with transaction.atomic():
        current = Payment.objects.select_for_update().get(pk=payment_id)
        if (current.status != "initiated" or current.checkout_request_id != payment.checkout_request_id
                or current.mpesa_query_lease_until != lease):
            return "payment changed during query"

        result = code(data.get("ResultCode")) if data else None
        if (
            result is not None
            and code(data.get("ResponseCode")) == "0"
            and data.get("CheckoutRequestID") == current.checkout_request_id
            and identifier(data.get("MerchantRequestID"))
            and (not current.mpesa_merchant_request_id
                 or current.mpesa_merchant_request_id == data["MerchantRequestID"])
        ):
            if result == "0":
                order = Order.objects.select_for_update().get(pk=current.order_id)
                finish_confirmed(current, order, data)
                return "completed" if current.status == "completed" else "needs review"
            if result == CANCEL_CODE or result in FAILURE_CODES:
                current.status = "cancelled" if result == CANCEL_CODE else "failed"
                current.mpesa_issue = ""
                clear_query(current)
                current.save(update_fields=[
                    "status", "mpesa_issue", "mpesa_query_lease_until", "mpesa_next_query_at", "updated_at",
                ])
                order = Order.objects.select_for_update().get(pk=current.order_id)
                if not order.paid_at and order.status in {
                    Order.STATUS_PENDING, Order.STATUS_INITIATED, Order.STATUS_PAYMENT_FAILED,
                }:
                    OrderService.cancel_order(order)
                return current.status

        current.mpesa_query_lease_until = None
        if current.mpesa_query_attempts >= MAX_ATTEMPTS:
            current.mpesa_next_query_at = None
            current.mpesa_issue = "query_attempts_exhausted"
        else:
            delay = min(900, 10 * 2 ** (current.mpesa_query_attempts - 1))
            current.mpesa_next_query_at = timezone.now() + timedelta(seconds=delay)
        current.save(update_fields=[
            "mpesa_issue", "mpesa_query_lease_until", "mpesa_next_query_at", "updated_at",
        ])
        return "pending"


def clear_query(payment):
    payment.mpesa_query_lease_until = None
    payment.mpesa_next_query_at = None


def order_transaction_reference(payment):
    return payment.checkout_request_id if len(payment.checkout_request_id) <= 100 else f"mpesa:{payment.pk}"


def finish_confirmed(payment, order, data):
    expected = int(format_mpesa_amount(payment.amount))
    sent = payment.mpesa_sent_amount or expected
    clear_query(payment)
    if (
        order.total != payment.amount or sent != expected or sent < 1
        or ("Amount" in data and amount(data["Amount"]) != sent)
        or ("PartyB" in data and payment.mpesa_destination and str(data["PartyB"]) != payment.mpesa_destination)
        or ("BusinessShortCode" in data and payment.mpesa_shortcode
            and str(data["BusinessShortCode"]) != payment.mpesa_shortcode)
    ):
        payment.mpesa_issue = "intent_mismatch"
        payment.mpesa_query_attempts = MAX_ATTEMPTS
        payment.save(update_fields=[
            "mpesa_issue", "mpesa_query_attempts", "mpesa_query_lease_until", "mpesa_next_query_at", "updated_at",
        ])
        return

    # The transaction ID is bound to our original STK amount. Daraja may omit
    # the receipt. A callback's receipt is an advisory claim until verified.
    receipt = receipt_number(data.get("MpesaReceiptNumber"))
    if receipt:
        try:
            with transaction.atomic():
                payment.mpesa_receipt_number = receipt
                payment.save(update_fields=["mpesa_receipt_number", "updated_at"])
        except IntegrityError:
            payment.mpesa_receipt_number = None
            payment.mpesa_issue = "duplicate_receipt"
            payment.mpesa_query_attempts = MAX_ATTEMPTS
            payment.save(update_fields=[
                "mpesa_issue", "mpesa_query_attempts", "mpesa_query_lease_until", "mpesa_next_query_at", "updated_at",
            ])
            return

    payment.status = "completed"
    payment.completed_at = timezone.now()
    payment.mpesa_issue = "" if receipt else (
        payment.mpesa_callback_summary.get("issue") or "receipt_unverified"
    )

    if order.can_transition_to(Order.STATUS_PAID):
        order.payment_method = "mpesa"
        order.transaction_id = order_transaction_reference(payment)
        if receipt:
            order.mpesa_receipt_number = receipt
        order.save(update_fields=["payment_method", "transaction_id", "mpesa_receipt_number", "updated_at"])
        order.transition_to(Order.STATUS_PAID, publish=False)
        publish_event("order", order.pk, "order.paid", {"order_id": str(order.pk)})
    else:
        payment.mpesa_issue = "order_closed"

    payment.save(update_fields=[
        "status", "completed_at", "mpesa_issue", "mpesa_query_lease_until", "mpesa_next_query_at", "updated_at",
    ])
