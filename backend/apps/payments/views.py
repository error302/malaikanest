
import base64
import datetime
import hashlib
import json
import logging
import os
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

import requests
from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from .models import Payment, PaymentAuditLog
from .tasks import reconcile_payments_task, verify_mpesa_payment_async

logger = logging.getLogger("apps.payments")

MPESA_SAFARICOM_IPS = {
    "196.201.214.0/24",
    "196.201.213.0/24",
    "41.89.0.0/16",
    "41.86.0.0/16",
}


def is_valid_mpesa_ip(ip):
    import ipaddress

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


def _payload_hash(payload):
    serialized = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _audit_log(
    event_type,
    payload,
    payment=None,
    request_ip=None,
    checkout_request_id=None,
    merchant_request_id=None,
    result_code=None,
    notes="",
):
    try:
        PaymentAuditLog.objects.create(
            payment=payment,
            event_type=event_type,
            source="api",
            request_ip=request_ip,
            checkout_request_id=checkout_request_id,
            merchant_request_id=merchant_request_id,
            result_code=str(result_code) if result_code is not None else None,
            payload_hash=_payload_hash(payload),
            payload=payload,
            notes=notes,
        )
    except Exception as exc:
        logger.warning("payment audit log write skipped: %s", exc)


def _normalize_phone(phone):
    if not phone:
        return ""
    p = str(phone).replace("+254", "254").replace(" ", "").replace("-", "")
    if p.startswith("0"):
        p = "254" + p[1:]
    elif not p.startswith("254"):
        p = "254" + p
    return p


def _pick(data, *keys):
    if not isinstance(data, dict):
        return None
    for key in keys:
        if key in data:
            return data.get(key)
    return None

class InitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        payment_method = request.data.get("payment_method", "mpesa")

        if payment_method not in ["mpesa", "paypal", "card"]:
            return Response({"detail": "Invalid payment method"}, status=status.HTTP_400_BAD_REQUEST)

        if payment_method == "mpesa" and not request.data.get("phone"):
            return Response({"detail": "phone required for M-Pesa"}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.filter(pk=order_id, user=request.user).first()
        if not order:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.status != "pending":
            return Response({"detail": "Order not in pending state"}, status=status.HTTP_400_BAD_REQUEST)

        payment, created = Payment.objects.get_or_create(
            order=order,
            defaults={
                "amount": order.total,
                "payment_method": payment_method,
                "phone": request.data.get("phone"),
                "status": "initiated",
            },
        )

        if not created:
            if payment.status == "completed":
                return Response({"detail": "Payment already completed"}, status=status.HTTP_400_BAD_REQUEST)
            if request.data.get("phone") and not payment.phone:
                payment.phone = request.data.get("phone")
                payment.save(update_fields=["phone", "updated_at"])

        if payment_method == "mpesa":
            return Response({"payment_id": payment.id, "payment_method": "mpesa"})
        if payment_method == "paypal":
            return Response({"detail": "PayPal not yet supported"}, status=status.HTTP_501_NOT_IMPLEMENTED)
        return Response({"detail": "Card payment not yet supported"}, status=status.HTTP_501_NOT_IMPLEMENTED)


class MpesaSTKPushView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get("payment_id")
        phone = request.data.get("phone")

        if not payment_id or not phone:
            return Response({"detail": "payment_id and phone required"}, status=status.HTTP_400_BAD_REQUEST)

        phone = _normalize_phone(phone)

        payment = Payment.objects.filter(order__user=request.user, pk=payment_id, payment_method="mpesa").first()
        if not payment:
            return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == "completed":
            return Response({"detail": "Payment already completed"}, status=status.HTTP_400_BAD_REQUEST)

        consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        business_short_code = os.getenv("MPESA_BUSINESS_SHORT_CODE", "174379")
        till_number = os.getenv("MPESA_TILL_NUMBER", business_short_code)
        store_number = os.getenv("MPESA_STORE_NUMBER", business_short_code)
        passkey = os.getenv("MPESA_PASSKEY")
        callback_url = os.getenv("MPESA_CALLBACK_URL")
        mpesa_env = os.getenv("MPESA_ENV", "sandbox")

        if not all([consumer_key, consumer_secret, passkey]):
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            return Response({"detail": "M-Pesa not configured"}, status=status.HTTP_502_BAD_GATEWAY)

        if not callback_url:
            return Response({"detail": "M-Pesa callback URL not configured"}, status=status.HTTP_502_BAD_GATEWAY)

        if mpesa_env == "live" and ("localhost" in callback_url or not callback_url.startswith("https://")):
            return Response({"detail": "M-Pesa callback URL is not valid for production"}, status=status.HTTP_502_BAD_GATEWAY)

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
                return Response({"detail": "M-Pesa authentication failed"}, status=status.HTTP_502_BAD_GATEWAY)
            access_token = token_resp.json().get("access_token")
        except Exception as exc:
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            logger.error("M-Pesa auth exception: %s", str(exc))
            return Response({"detail": "M-Pesa service unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

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

                _audit_log(
                    event_type="stk_initiated",
                    payload={"request": {**payload, "Password": "***"}, "response": result},
                    payment=payment,
                    checkout_request_id=checkout_request_id,
                    notes="STK push initiated successfully",
                )
                verify_mpesa_payment_async.delay(payment.id)
                return Response({"detail": "STK initiated", "checkout_request_id": checkout_request_id})

            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            _audit_log(
                event_type="stk_failed",
                payload={"request": {**payload, "Password": "***"}, "response": result},
                payment=payment,
                result_code=result.get("ResponseCode"),
                notes=result.get("ResponseDescription", "STK push failed"),
            )
            return Response({"detail": result.get("ResponseDescription", "STK push failed")}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as exc:
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            _audit_log(
                event_type="stk_failed",
                payload={"request": {**payload, "Password": "***"}, "exception": str(exc)},
                payment=payment,
                notes="Exception during STK push",
            )
            return Response({"detail": "M-Pesa service error"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class MpesaInitiateAndPushView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        phone = request.data.get("phone")

        if not order_id or not phone:
            return Response({"detail": "order_id and phone are required"}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.filter(pk=order_id, user=request.user).first()
        if not order:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        if order.status != "pending":
            return Response({"detail": "Order not in pending state"}, status=status.HTTP_400_BAD_REQUEST)

        phone_norm = _normalize_phone(phone)

        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={"amount": order.total, "payment_method": "mpesa", "phone": phone_norm, "status": "initiated"},
        )
        if payment.status == "completed":
            return Response({"detail": "Payment already completed"}, status=status.HTTP_400_BAD_REQUEST)

        if payment.phone != phone_norm:
            payment.phone = phone_norm
            payment.save(update_fields=["phone", "updated_at"])

        consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        business_short_code = os.getenv("MPESA_BUSINESS_SHORT_CODE", "174379")
        till_number = os.getenv("MPESA_TILL_NUMBER", business_short_code)
        store_number = os.getenv("MPESA_STORE_NUMBER", business_short_code)
        passkey = os.getenv("MPESA_PASSKEY")
        callback_url = os.getenv("MPESA_CALLBACK_URL")
        mpesa_env = os.getenv("MPESA_ENV", "sandbox")

        if not all([consumer_key, consumer_secret, passkey, callback_url]):
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            return Response({"detail": "M-Pesa not configured. Please contact support."}, status=status.HTTP_502_BAD_GATEWAY)

        if mpesa_env == "live" and ("localhost" in callback_url or not callback_url.startswith("https://")):
            return Response({"detail": "Payment configuration error. Please contact support."}, status=status.HTTP_502_BAD_GATEWAY)

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
                return Response({"detail": "M-Pesa authentication failed"}, status=status.HTTP_502_BAD_GATEWAY)
            access_token = token_resp.json().get("access_token")
        except Exception:
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            return Response({"detail": "M-Pesa service unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(f"{business_short_code}{passkey}{timestamp}".encode()).decode()

        stk_url = (
            "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
            if mpesa_env == "live"
            else "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        )

        stk_payload = {
            "BusinessShortCode": store_number,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerBuyGoodsOnline",
            "Amount": format_mpesa_amount(payment.amount),
            "PartyA": phone_norm,
            "PartyB": till_number,
            "PhoneNumber": phone_norm,
            "CallBackURL": callback_url,
            "AccountReference": f"MalaikaNest-{order.id}",
            "TransactionDesc": "Malaika Nest Order Payment",
        }

        try:
            stk_resp = requests.post(stk_url, json=stk_payload, headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}, timeout=30)
            result = stk_resp.json()

            if stk_resp.status_code == 200 and result.get("ResponseCode") == "0":
                checkout_request_id = result.get("CheckoutRequestID")
                payment.checkout_request_id = checkout_request_id
                payment.save(update_fields=["checkout_request_id", "updated_at"])
                _audit_log(
                    event_type="stk_initiated",
                    payload={"request": {**stk_payload, "Password": "***"}, "response": result},
                    payment=payment,
                    checkout_request_id=checkout_request_id,
                    notes="Consolidated pay endpoint initiated STK",
                )
                verify_mpesa_payment_async.delay(payment.id)
                return Response({"detail": "STK push initiated. Check your phone for M-Pesa prompt.", "checkout_request_id": checkout_request_id, "order_id": order.id})

            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            _audit_log(
                event_type="stk_failed",
                payload={"request": {**stk_payload, "Password": "***"}, "response": result},
                payment=payment,
                result_code=result.get("ResponseCode"),
                notes=result.get("ResponseDescription", "STK push failed"),
            )
            return Response({"detail": result.get("ResponseDescription", "STK push failed")}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as exc:
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            _audit_log(
                event_type="stk_failed",
                payload={"request": {**stk_payload, "Password": "***"}, "exception": str(exc)},
                payment=payment,
                notes="Exception during consolidated STK push",
            )
            return Response({"detail": "M-Pesa service error. Please try again."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@method_decorator(csrf_exempt, name="dispatch")
class MpesaCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Trust only Nginx-overwritten X-Real-IP (or REMOTE_ADDR fallback), never user-controlled X-Forwarded-For.
        client_ip = request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR")

        is_safaricom = is_valid_mpesa_ip(client_ip)
        if not is_safaricom:
            _audit_log(event_type="callback_blocked", payload=request.data, request_ip=client_ip, notes="Blocked non-Safaricom callback in production")
            return JsonResponse({"ResultCode": 1, "ResultDesc": "Unauthorized"}, status=200)

        raw = request.data
        body = _pick(raw, "Body", "body") or {}
        callback_result = _pick(body, "stkCallback", "stkcallback", "stk_callback") or {}
        checkout_id = _pick(callback_result, "CheckoutRequestID", "checkoutRequestID", "checkout_request_id")
        merchant_request_id = _pick(callback_result, "MerchantRequestID", "merchantRequestID", "merchant_request_id")
        result_code = _pick(callback_result, "ResultCode", "resultCode", "result_code")

        _audit_log(event_type="callback_received", payload=raw, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code)

        with transaction.atomic():
            payment = None
            if checkout_id:
                payment = Payment.objects.select_for_update().filter(checkout_request_id=checkout_id).first()
            if not payment and merchant_request_id:
                payment = Payment.objects.select_for_update().filter(order__receipt_number=merchant_request_id).first()

            if not payment:
                _audit_log(event_type="callback_unmatched", payload=raw, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, notes="No matching payment")
                return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"}, status=200)

            if payment.status == "completed":
                payment.raw_callback = raw
                payment.save(update_fields=["raw_callback", "updated_at"])
                _audit_log(event_type="callback_duplicate", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code)
                return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"}, status=200)

            payment.raw_callback = raw
            callback_metadata = _pick(callback_result, "CallbackMetadata", "callbackMetadata", "callback_metadata") or {}

            if str(result_code) == "0":
                callback_items = _pick(callback_metadata, "Item", "item") or []
                items = {it.get("Name") or it.get("name"): it.get("Value") or it.get("value") for it in callback_items}
                receipt = items.get("MpesaReceiptNumber")
                amount = items.get("Amount")
                callback_phone = items.get("PhoneNumber")

                try:
                    if Decimal(str(amount)) != payment.amount:
                        payment.status = "failed"
                        payment.save(update_fields=["status", "updated_at"])
                        _audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code="AMOUNT_MISMATCH", notes=f"Expected {payment.amount}, got {amount}")
                        return JsonResponse({"ResultCode": 1, "ResultDesc": "Amount mismatch"}, status=200)
                except (InvalidOperation, TypeError):
                    payment.status = "failed"
                    payment.save(update_fields=["status", "updated_at"])
                    _audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code="INVALID_AMOUNT")
                    return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid amount"}, status=200)

                order_phone = payment.phone or (payment.order.user.phone if payment.order.user and hasattr(payment.order.user, "phone") else None)
                if order_phone and callback_phone and _normalize_phone(order_phone) != _normalize_phone(callback_phone):
                    payment.status = "failed"
                    payment.save(update_fields=["status", "raw_callback", "updated_at"])
                    _audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code="PHONE_MISMATCH")
                    return JsonResponse({"ResultCode": 1, "ResultDesc": "Phone mismatch"}, status=200)

                if receipt and Payment.objects.filter(mpesa_receipt_number=receipt).exclude(pk=payment.pk).exists():
                    _audit_log(event_type="callback_duplicate_receipt", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code, notes="Receipt already processed")
                    return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"}, status=200)

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

                _audit_log(event_type="callback_completed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code)
                return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})

            result_desc = callback_result.get("ResultDesc", "Unknown error")
            payment.status = "failed"
            payment.save(update_fields=["status", "raw_callback", "updated_at"])
            payment.order.status = "payment_failed"
            payment.order.save(update_fields=["status", "updated_at"])
            _audit_log(event_type="callback_failed", payload=raw, payment=payment, request_ip=client_ip, checkout_request_id=checkout_id, merchant_request_id=merchant_request_id, result_code=result_code, notes=result_desc)
            return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})

class AdminReconcileCandidatesView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        stale_minutes = int(request.query_params.get("stale_minutes", 30))
        limit = min(int(request.query_params.get("limit", 100)), 500)
        cutoff = timezone.now() - datetime.timedelta(minutes=stale_minutes)

        candidates = (
            Payment.objects.select_related("order")
            .filter(payment_method="mpesa", status="initiated", created_at__lt=cutoff)
            .exclude(checkout_request_id__isnull=True)
            .exclude(checkout_request_id="")
            .order_by("created_at")[:limit]
        )

        data = [
            {
                "payment_id": p.id,
                "order_id": p.order_id,
                "order_status": p.order.status,
                "checkout_request_id": p.checkout_request_id,
                "amount": str(p.amount),
                "created_at": p.created_at,
                "status": p.status,
            }
            for p in candidates
        ]
        return Response({"count": len(data), "results": data})


class AdminReconcilePaymentsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        payment_id = request.data.get("payment_id")
        order_id = request.data.get("order_id")
        stale_minutes = int(request.data.get("stale_minutes", 30))
        limit = min(int(request.data.get("limit", 200)), 500)

        if payment_id or order_id:
            payment = None
            if payment_id:
                payment = Payment.objects.filter(pk=payment_id, payment_method="mpesa").first()
            elif order_id:
                payment = Payment.objects.filter(order_id=order_id, payment_method="mpesa").first()

            if not payment:
                return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

            verify_mpesa_payment_async.delay(payment.id)
            _audit_log(
                event_type="reconcile_queued",
                payload={"payment_id": payment.id, "trigger": "admin_endpoint"},
                payment=payment,
                checkout_request_id=payment.checkout_request_id,
                notes=f"Queued by admin {request.user.id}",
            )
            return Response({"detail": "Payment reconciliation queued", "payment_id": payment.id, "order_id": payment.order_id})

        reconcile_payments_task.delay(stale_minutes=stale_minutes, limit=limit)
        return Response({"detail": "Bulk reconciliation queued", "stale_minutes": stale_minutes, "limit": limit})


@method_decorator(csrf_exempt, name="dispatch")
class PayPalCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger.info("PayPal callback received but PayPal is not yet implemented: %s", request.data)
        return JsonResponse({"detail": "PayPal payments are not currently supported"}, status=501)


@method_decorator(csrf_exempt, name="dispatch")
class CardCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger.info("Card callback received but card payments are not yet implemented: %s", request.data)
        return JsonResponse({"detail": "Card payments are not currently supported"}, status=501)


