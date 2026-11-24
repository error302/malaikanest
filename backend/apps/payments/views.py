
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
from django.db.models import Count, Q
from django.http import JsonResponse, HttpResponseRedirect
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle

from apps.orders.models import Order
from apps.core.utils import get_client_ip
from .models import Payment, PaymentAuditLog
from .gateway import PaymentGatewayFactory
from .paypal import PayPalGateway, PayPalService
from .tasks import reconcile_payments_task, verify_mpesa_payment_async, verify_pesapal_payment_async

logger = logging.getLogger("apps.payments")

from .services import PaymentService, normalize_phone, audit_log


def resolve_order_for_request(request, order_id):
    """
    Resolve an order for payment actions.

    Authenticated users are scoped to their own orders. Guest (anonymous)
    requests are only ever resolved against GUEST orders (user is NULL) and
    require an unguessable secret — `checkout_token` (preferred) or
    `receipt_number` (legacy). The order id is sequential and guessable, and
    the guest email leaks via the receipt email, so `order_id + guest_email`
    is NOT a sufficient authorization factor. Guest actions must never
    resolve to an authenticated user's order.
    """
    order_qs = Order.objects.all()

    if request.user.is_authenticated:
        return order_qs.filter(pk=order_id, user=request.user).first()

    checkout_token = (request.data.get("checkout_token") or request.query_params.get("checkout_token") or "").strip()
    if checkout_token:
        return order_qs.filter(pk=order_id, checkout_token=checkout_token, user__isnull=True).first()

    receipt_number = (request.data.get("receipt_number") or request.query_params.get("receipt_number") or "").strip()
    if receipt_number:
        return order_qs.filter(pk=order_id, receipt_number=receipt_number, user__isnull=True).first()

    return None

class InitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        payment_method = request.data.get("payment_method", "mpesa")

        if payment_method not in ["mpesa", "paypal", "card", "pesapal"]:
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
        if payment_method == "pesapal":
            return Response({"payment_id": payment.id, "payment_method": "pesapal"})
        if payment_method == "paypal":
            return Response({"payment_id": payment.id, "payment_method": "paypal"})
        return Response({"detail": "Card payment not yet supported"}, status=status.HTTP_501_NOT_IMPLEMENTED)


class MpesaSTKPushView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get("payment_id")
        phone = request.data.get("phone")

        if not payment_id or not phone:
            return Response({"detail": "payment_id and phone required"}, status=status.HTTP_400_BAD_REQUEST)

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

        phone_norm = phone

        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={"amount": order.total, "payment_method": "mpesa", "phone_number": phone_norm, "status": "initiated"},
        )
        if payment.status == "completed":
            return Response({"detail": "Payment already completed"}, status=status.HTTP_400_BAD_REQUEST)

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

    permission_classes = [permissions.AllowAny]
    throttle_scope = "payments"

    def post(self, request):
        order_id = request.data.get("order_id")
        phone = request.data.get("phone") or request.data.get("phone_number")
        if not order_id or not phone:
            return Response({"detail": "order_id and phone are required"}, status=status.HTTP_400_BAD_REQUEST)

        order = resolve_order_for_request(request, order_id)
        if not order:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        if order.status != "pending":
            return Response({"detail": "Order not in pending state"}, status=status.HTTP_400_BAD_REQUEST)

        phone_norm = phone
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

        try:
            checkout_request_id = PaymentService.initiate_mpesa_stk(payment, phone_norm)
            return Response({"checkout_request_id": checkout_request_id, "order_id": order.id})
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PaymentVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "payments"

    def get(self, request, checkout_request_id):
        payment_qs = Payment.objects.select_related("order").filter(
            mpesa_checkout_request_id=checkout_request_id
        )

        if request.user.is_authenticated:
            payment = payment_qs.filter(order__user=request.user).first()
        else:
            token = request.query_params.get("checkout_token", "")
            payment = payment_qs.filter(order__checkout_token=token, order__user__isnull=True).first() if token else None

        if not payment:
            return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "checkout_request_id": payment.checkout_request_id,
                "status": payment.status,
                "order_id": payment.order_id,
                "order_paid": payment.order.status in {"paid", "processing", "shipped", "delivered"},
                "mpesa_receipt_number": payment.mpesa_receipt_number,
            },
            headers={"Cache-Control": "private, no-store"},
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


class MpesaCallbackThrottle(ScopedRateThrottle):
    def get_ident(self, request):
        return get_client_ip(request)


@method_decorator(csrf_exempt, name="dispatch")
class MpesaCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    authentication_classes = []
    throttle_classes = [MpesaCallbackThrottle]
    throttle_scope = "mpesa_callback"

    def post(self, request):
        from .mpesa_verification import queue_callback

        if request.content_type.split(";", 1)[0] != "application/json":
            return JsonResponse({"ResultCode": 1}, status=415)
        body = request.stream.read(16385) if request.stream else b""
        if len(body) > 16384:
            return JsonResponse({"ResultCode": 1}, status=413)
        try:
            queue_callback(json.loads(body))
        except (ValueError, RecursionError):
            return JsonResponse({"ResultCode": 1}, status=400)
        return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})


class PesapalInitiateView(APIView):
    """
    POST /api/v1/payments/pesapal/initiate/

    Creates (or reuses) a Payment for the order and calls Pesapal SubmitOrder.
    Returns the `redirect_url` the shopper must open to complete payment.
    """

    permission_classes = [permissions.AllowAny]
    throttle_scope = "payments"

    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response({"detail": "order_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        order = resolve_order_for_request(request, order_id)
        if not order:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        if order.status != "pending":
            return Response({"detail": "Order not in pending state"}, status=status.HTTP_400_BAD_REQUEST)

        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={
                "amount": order.total,
                "payment_method": "pesapal",
                "status": "initiated",
                "phone_number": request.data.get("phone") or order.guest_phone,
            },
        )

        try:
            if Decimal(str(payment.amount)) != Decimal(str(order.total)):
                return Response({"detail": "Order total mismatch"}, status=status.HTTP_400_BAD_REQUEST)
        except (InvalidOperation, TypeError):
            return Response({"detail": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        if payment.status == "completed":
            return Response(
                {"detail": "Payment already completed", "payment_id": payment.id, "redirect_url": None},
                status=status.HTTP_400_BAD_REQUEST,
            )

        billing = {
            "email": request.data.get("email") or order.guest_email,
            "phone": request.data.get("phone") or order.guest_phone,
            "first_name": request.data.get("first_name") or order.shipping_first_name,
            "last_name": request.data.get("last_name") or order.shipping_last_name,
            "country_code": request.data.get("country_code", "KE"),
        }

        try:
            gateway = PaymentGatewayFactory.create("pesapal")
            result = gateway.initiate(payment, **billing)
        except Exception as exc:
            logger.exception("Pesapal initiate failed for order %s: %s", order.id, exc)
            return Response({"detail": f"Pesapal initiation failed: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(
            {
                "payment_id": payment.id,
                "order_id": order.id,
                "redirect_url": result.get("redirect_url"),
                "tracking_id": result.get("tracking_id"),
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class PesapalCallbackView(APIView):
    """
    GET (browser redirect) /api/v1/payments/pesapal/callback/

    Pesapal redirects the shopper's browser here after they finish on Pesapal.
    We resolve the order and send the browser to the storefront success page;
    final fulfilment is performed by the IPN view.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        tracking_id = (request.query_params.get("pesapal_transaction_tracking_id") or "").strip()
        merchant_ref = (request.query_params.get("pesapal_merchant_reference") or "").strip()

        payment = None
        if tracking_id:
            payment = Payment.objects.filter(pesapal_tracking_id=tracking_id).select_related("order").first()
        if not payment and merchant_ref:
            payment = Payment.objects.filter(pesapal_merchant_reference=merchant_ref).select_related("order").first()

        receipt = payment.order.receipt_number if payment else ""
        frontend = os.getenv("FRONTEND_URL", "https://malaikanest.com").rstrip("/")
        success_url = f"{frontend}/checkout/success?order={receipt}"
        return JsonResponse({"status": "ok", "redirect": success_url}, status=200)

    def post(self, request):
        return self.get(request)


@method_decorator(csrf_exempt, name="dispatch")
class PesapalIPNView(APIView):
    """
    POST/GET /api/v1/payments/pesapal/ipn/

    Pesapal's IPN webhook. We must reply with the IPN acknowledgement JSON and
    then query the real transaction status to confirm the money. Pesapal's
    callback/IPN only carries the tracking + merchant reference — the actual
    status is fetched via GetTransactionStatus.
    """

    permission_classes = [permissions.AllowAny]

    def _respond(self, tracking_id, merchant_ref, http_status=200):
        return JsonResponse(
            {
                "orderNotificationType": "IPNCHANGE",
                "orderTrackingId": tracking_id or "",
                "orderMerchantReference": merchant_ref or "",
                "status": 200,
            },
            status=http_status,
        )

    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        tracking_id = (
            data.get("pesapal_transaction_tracking_id")
            or request.query_params.get("pesapal_transaction_tracking_id")
            or _extract_param(request.body, "pesapal_transaction_tracking_id")
            or ""
        ).strip()
        merchant_ref = (
            data.get("pesapal_merchant_reference")
            or request.query_params.get("pesapal_merchant_reference")
            or _extract_param(request.body, "pesapal_merchant_reference")
            or ""
        ).strip()

        if not tracking_id and not merchant_ref:
            return self._respond(tracking_id, merchant_ref, http_status=200)

        payment = None
        if tracking_id:
            payment = Payment.objects.filter(pesapal_tracking_id=tracking_id).select_related("order").first()
        if not payment and merchant_ref:
            payment = Payment.objects.filter(pesapal_merchant_reference=merchant_ref).select_related("order").first()

        if not payment:
            audit_log(
                event_type="ipn_received",
                payload={"tracking_id": tracking_id, "merchant_ref": merchant_ref},
                notes="IPN for unknown payment",
                source="ipn",
            )
            return self._respond(tracking_id, merchant_ref)

        try:
            from .pesapal import PesapalService

            status_resp = PesapalService.get_transaction_status(payment.pesapal_tracking_id)
            PesapalService.apply_status(payment, status_resp, source="ipn")
        except Exception as exc:
            logger.exception("Pesapal IPN status check failed for payment %s: %s", payment.pk, exc)

        return self._respond(tracking_id, merchant_ref)

    def get(self, request):
        return self.post(request)


def _extract_param(body, key):
    if not body:
        return ""
    try:
        text = body.decode("utf-8") if isinstance(body, bytes) else str(body)
    except Exception:
        logger.debug("_extract_param: body decode failed for key=%s", key)
        return ""
    import re

    m = re.search(rf"{re.escape(key)}=([^&\s]+)", text)
    return m.group(1) if m else ""


class AdminMpesaPaymentsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        filters = {
            "pending": Q(status="initiated", mpesa_issue=""),
            "confirmed": Q(status="completed"),
            "failed": Q(status="failed"),
            "cancelled": Q(status="cancelled"),
            "unreconciled": ~Q(mpesa_issue=""),
        }
        selected = request.query_params.get("state", "unreconciled")
        if selected not in filters:
            return Response({"detail": "Unknown payment status."}, status=400)
        try:
            page = max(1, min(10000, int(request.query_params.get("page", "1"))))
        except ValueError:
            return Response({"detail": "Invalid page."}, status=400)
        payments = Payment.objects.filter(payment_method="mpesa")
        counts = payments.aggregate(**{key: Count("pk", filter=value) for key, value in filters.items()})
        offset = (page - 1) * 30
        rows = list(payments.filter(filters[selected]).select_related("order").order_by(
            "-initiated_at", "-pk",
        )[offset:offset + 31])
        return Response({
            "counts": counts,
            "has_next": len(rows) > 30,
            "transactions": [{
                "id": payment.pk,
                "order": payment.order.receipt_number,
                "order_status": payment.order.get_status_display(),
                "amount": str(payment.mpesa_sent_amount or payment.amount),
                "status": payment.status,
                "issue": payment.mpesa_issue,
                "receipt": payment.mpesa_receipt_number,
                "reported_receipt": payment.mpesa_callback_summary.get("receipt"),
                "checkout_id": payment.checkout_request_id,
                "destination": payment.mpesa_destination,
                "initiated_at": payment.initiated_at,
                "confirmed_at": payment.completed_at,
                "statement_verified_at": payment.mpesa_statement_verified_at,
            } for payment in rows[:30]],
        }, headers={"Cache-Control": "private, no-store"})


class AdminReconcileCandidatesView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        stale_minutes = int(request.query_params.get("stale_minutes", 30))
        limit = min(int(request.query_params.get("limit", 100)), 500)
        cutoff = timezone.now() - datetime.timedelta(minutes=stale_minutes)

        candidates = (
            Payment.objects.select_related("order")
            .filter(payment_method__in=["mpesa", "pesapal"], status="initiated", created_at__lt=cutoff)
            .exclude(mpesa_checkout_request_id__isnull=True, pesapal_tracking_id__isnull=True)
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
            from .mpesa_verification import schedule_verification

            payment = None
            if payment_id:
                payment = Payment.objects.filter(pk=payment_id, payment_method__in=["mpesa", "pesapal"]).first()
            elif order_id:
                payment = Payment.objects.filter(order_id=order_id, payment_method__in=["mpesa", "pesapal"]).first()

            if not payment:
                return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

            if payment.payment_method == "mpesa":
                schedule_verification(Payment.objects.filter(pk=payment.pk))
            else:
                verify_pesapal_payment_async.delay(payment.pk)
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


class PayPalInitiateView(APIView):
    """POST /api/v1/payments/paypal/initiate/ — creates a PayPal order and returns the approval URL."""

    permission_classes = [permissions.AllowAny]
    throttle_scope = "payments"

    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response({"detail": "order_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        order = resolve_order_for_request(request, order_id)
        if not order:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.status != "pending":
            return Response(
                {"detail": f"Order is not in pending status (current: {order.status})"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment, _ = Payment.objects.get_or_create(
                order=order,
                payment_method="paypal",
                defaults={"status": "pending", "amount": order.total},
            )

            result = PayPalGateway().initiate(payment)

            approval_url = next(
                (link["href"] for link in result.get("links", []) if link.get("rel") == "approve"),
                None,
            )

            logger.info(
                "PayPal order created for Order #%s — PayPal order ID: %s",
                order.receipt_number,
                result.get("paypal_order_id"),
            )

            return Response(
                {
                    "payment_id": payment.id,
                    "order_id": order.id,
                    "paypal_order_id": result.get("paypal_order_id"),
                    "approval_url": approval_url,
                    "amount_usd": result.get("amount_usd"),
                    "currency": result.get("currency"),
                }
            )
        except Exception as exc:
            logger.exception("PayPal initiate failed for order %s: %s", order_id, exc)
            return Response(
                {"detail": "Failed to initiate PayPal payment. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class PayPalCaptureView(APIView):
    """POST /api/v1/payments/paypal/capture/ — captures an approved PayPal order."""

    permission_classes = [permissions.AllowAny]
    throttle_scope = "payments"

    def post(self, request):
        paypal_order_id = request.data.get("paypal_order_id")
        if not paypal_order_id:
            return Response({"detail": "paypal_order_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        payment = None
        payment_id = request.data.get("payment_id")
        order_id = request.data.get("order_id")

        if payment_id:
            payment = Payment.objects.filter(pk=payment_id).first()
        elif order_id:
            order = resolve_order_for_request(request, order_id)
            if order:
                payment = Payment.objects.filter(order=order, payment_method="paypal").first()

        if not payment:
            return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            result = PayPalService().capture_order(paypal_order_id, payment)
            logger.info(
                "PayPal capture completed for Payment #%s — status: %s",
                payment.id,
                result.get("status"),
            )
            return Response(result)
        except Exception as exc:
            logger.exception("PayPal capture failed for paypal_order_id %s: %s", paypal_order_id, exc)
            return Response(
                {"detail": "Failed to capture PayPal payment. Please contact support."},
                status=status.HTTP_502_BAD_GATEWAY,
            )


@method_decorator(csrf_exempt, name="dispatch")
class PayPalCallbackView(APIView):
    """Handles PayPal redirect callbacks (return_url) after buyer approves on PayPal."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        paypal_order_id = request.query_params.get("token")
        order_id = request.query_params.get("order_id")
        receipt = request.query_params.get("receipt") or ""
        checkout_token = request.query_params.get("checkout_token") or ""
        frontend_url = os.getenv("FRONTEND_URL", "https://malaikanest.com").rstrip("/")

        logger.info(
            "PayPal GET redirect received — paypal_order_id: %s, order_id: %s, receipt: %s",
            paypal_order_id,
            order_id,
            receipt,
        )

        payment = None
        if order_id:
            order = resolve_order_for_request(request, order_id)
            if order:
                payment = Payment.objects.filter(order=order, payment_method="paypal").first()

        if not payment and paypal_order_id:
            payment = Payment.objects.filter(paypal_transaction_id=paypal_order_id).first()

        if not payment and receipt:
            payment = Payment.objects.filter(order__receipt_number=receipt, payment_method="paypal").first()

        if payment and not receipt:
            receipt = payment.order.receipt_number
            checkout_token = payment.order.checkout_token

        if payment and paypal_order_id and payment.status != "completed":
            try:
                PayPalService().capture_order(paypal_order_id, payment)
                logger.info("PayPal redirect capture succeeded for Order #%s", receipt)
            except Exception as exc:
                logger.exception("PayPal redirect capture failed for Order #%s: %s", receipt, exc)

        success_url = f"{frontend_url}/checkout/success?order={receipt}&token={checkout_token}&status=paid"
        return HttpResponseRedirect(success_url)

    def post(self, request):
        paypal_order_id = request.query_params.get("token") or request.data.get("paypal_order_id")
        order_id = request.data.get("order_id") or request.query_params.get("order_id")

        logger.info(
            "PayPal callback received — paypal_order_id: %s, order_id: %s",
            paypal_order_id,
            order_id,
        )

        if not paypal_order_id:
            logger.warning("PayPal callback received with no paypal_order_id / token")
            return Response({"detail": "ok"})

        payment = None
        if order_id:
            order = resolve_order_for_request(request, order_id)
            if order:
                payment = Payment.objects.filter(order=order, payment_method="paypal").first()

        if not payment:
            # Also try by paypal_transaction_id field if stored
            payment = Payment.objects.filter(paypal_transaction_id=paypal_order_id).first()

        if not payment:
            logger.warning("PayPal callback: no matching payment found for paypal_order_id %s", paypal_order_id)
            return Response({"detail": "ok"})

        try:
            result = PayPalService().capture_order(paypal_order_id, payment)
            logger.info("PayPal callback capture result for Payment #%s: %s", payment.id, result.get("status"))
            return Response(result)
        except Exception as exc:
            logger.exception("PayPal callback capture failed: %s", exc)
            return Response(
                {"detail": "Capture failed"},
                status=status.HTTP_502_BAD_GATEWAY,
            )


@method_decorator(csrf_exempt, name="dispatch")
class CardCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger.info("Card callback received but card payments are not yet implemented: %s", request.data)
        return JsonResponse({"detail": "Card payments are not currently supported"}, status=501)


