
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

from .services import PaymentService, normalize_phone, is_valid_mpesa_ip, audit_log

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
                "phone_number": request.data.get("phone"),
                "status": "initiated",
            },
        )

        if not created:
            if payment.status == "completed":
                return Response({"detail": "Payment already completed"}, status=status.HTTP_400_BAD_REQUEST)
            if request.data.get("phone") and not payment.phone:
                payment.phone = request.data.get("phone")
                payment.save(update_fields=["phone_number", "updated_at"])

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

        phone = normalize_phone(phone)

        payment = Payment.objects.filter(order__user=request.user, pk=payment_id, payment_method="mpesa").first()
        if not payment:
            return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        if payment.status == "completed":
            return Response({"detail": "Payment already completed"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            checkout_request_id = PaymentService.initiate_mpesa_stk(payment, phone)
            return Response({"detail": "STK initiated", "checkout_request_id": checkout_request_id})
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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

        phone_norm = normalize_phone(phone)

        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={"amount": order.total, "payment_method": "mpesa", "phone_number": phone_norm, "status": "initiated"},
        )
        if payment.status == "completed":
            return Response({"detail": "Payment already completed"}, status=status.HTTP_400_BAD_REQUEST)

        if payment.phone != phone_norm:
            payment.phone = phone_norm
            payment.save(update_fields=["phone_number", "updated_at"])

        try:
            checkout_request_id = PaymentService.initiate_mpesa_stk(payment, phone_norm)
            return Response({"detail": "STK push initiated. Check your phone for M-Pesa prompt.", "checkout_request_id": checkout_request_id, "order_id": order.id})
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)


class MpesaInitiateView(APIView):
    """
    Single-call endpoint required by the frontend:
    - Validates order + amount + phone
    - Initiates STK push
    - Returns CheckoutRequestID
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "payments"

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

        phone_norm = normalize_phone(phone)
        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={
                "amount": order.total,
                "payment_method": "mpesa",
                "phone_number": phone_norm,
                "status": "initiated",
            },
        )

        # Validate amount hasn't drifted.
        try:
            if Decimal(str(payment.amount)) != Decimal(str(order.total)):
                return Response({"detail": "Order total mismatch"}, status=status.HTTP_400_BAD_REQUEST)
        except (InvalidOperation, TypeError):
            return Response({"detail": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        if payment.status == "completed":
            return Response({"detail": "Payment already completed"}, status=status.HTTP_400_BAD_REQUEST)

        if payment.phone != phone_norm:
            payment.phone = phone_norm
            payment.save(update_fields=["phone_number", "updated_at"])

        try:
            checkout_request_id = PaymentService.initiate_mpesa_stk(payment, phone_norm)
            return Response({"checkout_request_id": checkout_request_id, "order_id": order.id})
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PaymentVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "payments"

    def get(self, request, checkout_request_id):
        payment = (
            Payment.objects.select_related("order")
            .filter(mpesa_checkout_request_id=checkout_request_id, order__user=request.user)
            .first()
        )
        if not payment:
            return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "checkout_request_id": payment.checkout_request_id,
                "status": payment.status,
                "order_id": payment.order_id,
                "mpesa_receipt_number": payment.mpesa_receipt_number,
            }
        )


class PaymentStatusByIdView(APIView):
    """
    GET /api/v1/payments/{id}/status/

    Frontend polling endpoint used during checkout after an STK Push is
    triggered. The client polls this endpoint every 3 seconds for up to 2
    minutes waiting for the M-Pesa callback to arrive and flip status to
    'completed'. Returns only the minimal fields needed for the polling loop —
    never exposes raw callback JSON or internal DB IDs in sequential form.

    Permission: IsAuthenticated + caller must own the payment (order__user check).
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "payments"

    def get(self, request, pk):
        # Scope to the authenticated user's payments — any other PK returns 404
        # so we don't leak the existence of other users' payment records.
        payment = (
            Payment.objects.select_related("order")
            .filter(pk=pk, order__user=request.user)
            .first()
        )
        if not payment:
            return Response(
                {"status": "error", "message": "Payment not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        logger.info(
            "payment_status_poll order=%s payment=%s status=%s user=%s",
            payment.order_id,
            payment.pk,
            payment.status,
            request.user.pk,
        )

        return Response(
            {
                "status": "success",
                "data": {
                    "payment_id": payment.pk,
                    "payment_status": payment.status,
                    "checkout_request_id": payment.checkout_request_id,
                    "mpesa_receipt_number": payment.mpesa_receipt_number,
                    "order_id": payment.order_id,
                    "amount": str(payment.amount),
                    "payment_method": payment.payment_method,
                },
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class MpesaCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Trust only Nginx-overwritten X-Real-IP (or REMOTE_ADDR fallback), never user-controlled X-Forwarded-For.
        client_ip = request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR")

        # In development/tests we allow simulating Safaricom callbacks via X-Forwarded-For.
        if getattr(settings, "DEBUG", False):
            xff = request.META.get("HTTP_X_FORWARDED_FOR")
            if xff:
                client_ip = xff.split(",")[0].strip()

        is_safaricom = is_valid_mpesa_ip(client_ip)
        if not getattr(settings, "DEBUG", False) and not is_safaricom:
            audit_log(event_type="callback_blocked", payload=request.data, request_ip=client_ip, notes="Blocked non-Safaricom callback in production")
            return JsonResponse({"ResultCode": 1, "ResultDesc": "Unauthorized"}, status=200)

        raw_payload = request.data
        # Prefer raw JSON body when present; it's the most faithful representation and
        # avoids issues where `request.data` is a flattened QueryDict.
        try:
            body_bytes = getattr(getattr(request, "_request", None), "body", b"") or b""
            if body_bytes:
                parsed = json.loads(body_bytes.decode("utf-8"))
                if isinstance(parsed, dict):
                    raw_payload = parsed
        except Exception:
            pass

        response_dict = PaymentService.process_callback(raw_payload, client_ip)
        return JsonResponse(response_dict, status=200)

class AdminReconcileCandidatesView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        stale_minutes = int(request.query_params.get("stale_minutes", 30))
        limit = min(int(request.query_params.get("limit", 100)), 500)
        cutoff = timezone.now() - datetime.timedelta(minutes=stale_minutes)

        candidates = (
            Payment.objects.select_related("order")
            .filter(payment_method="mpesa", status="initiated", created_at__lt=cutoff)
            .exclude(mpesa_checkout_request_id__isnull=True)
            .exclude(mpesa_checkout_request_id="")
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
            audit_log(
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


