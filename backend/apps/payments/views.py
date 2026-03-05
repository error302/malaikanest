import os
import base64
import datetime
import logging
import requests
from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from apps.orders.models import Order
from .models import Payment
from .serializers import PaymentSerializer
from .tasks import verify_mpesa_payment_async

logger = logging.getLogger("apps.payments")

# Safaricom IP ranges for M-Pesa callbacks (Kenya)
MPESA_SAFARICOM_IPS = {
    "196.201.214.0/24",  # Safaricom production
    "196.201.213.0/24",  # Safaricom production
    "41.89.0.0/16",      # Safaricom
    "41.86.0.0/16",      # Safaricom
}


def is_valid_mpesa_ip(ip):
    """Check if request comes from Safaricom IP range"""
    import ipaddress
    for net in MPESA_SAFARICOM_IPS:
        try:
            if ipaddress.ip_address(ip) in ipaddress.ip_network(net):
                return True
        except ValueError:
            continue
    return False


class InitiatePaymentView(APIView):
    """
    Step 1: Create a Payment record for an order.
    Returns payment_id which is used by MpesaSTKPushView.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        payment_method = request.data.get("payment_method", "mpesa")

        if payment_method not in ["mpesa", "paypal", "card"]:
            return Response(
                {"detail": "Invalid payment method"}, status=status.HTTP_400_BAD_REQUEST
            )

        if payment_method == "mpesa":
            phone = request.data.get("phone")
            if not phone:
                return Response(
                    {"detail": "phone required for M-Pesa"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        order = Order.objects.filter(pk=order_id, user=request.user).first()
        if not order:
            return Response(
                {"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if order.status != "pending":
            return Response(
                {"detail": "Order not in pending state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # CRIT-06 (HIGH-04): Use get_or_create to prevent duplicate payments
        # and IntegrityError on OneToOneField if called twice
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
            # Existing payment — return it (idempotent)
            if payment.status == "completed":
                return Response(
                    {"detail": "Payment already completed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Update phone if provided and not already set
            if request.data.get("phone") and not payment.phone:
                payment.phone = request.data.get("phone")
                payment.save(update_fields=["phone"])

        if payment_method == "mpesa":
            return Response({"payment_id": payment.id, "payment_method": "mpesa"})
        elif payment_method == "paypal":
            return Response({"detail": "PayPal not yet supported"}, status=status.HTTP_501_NOT_IMPLEMENTED)
        elif payment_method == "card":
            return Response({"detail": "Card payment not yet supported"}, status=status.HTTP_501_NOT_IMPLEMENTED)


class MpesaSTKPushView(APIView):
    """
    Step 2: Trigger Safaricom STK Push for a payment.
    Requires payment_id from InitiatePaymentView.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get("payment_id")
        phone = request.data.get("phone")

        if not payment_id or not phone:
            return Response(
                {"detail": "payment_id and phone required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Normalize phone to 254XXXXXXXXX format
        phone = phone.replace("+254", "").replace(" ", "").replace("-", "")
        if phone.startswith("0"):
            phone = "254" + phone[1:]
        elif not phone.startswith("254"):
            phone = "254" + phone

        # CRIT-07: Only allow access to the payment if the order belongs to this user
        # Removed the Q(order__user__isnull=True) hole that let any user access guest payments
        payment = Payment.objects.filter(
            order__user=request.user,
            pk=payment_id,
            payment_method="mpesa",
        ).first()
        if not payment:
            return Response(
                {"detail": "Payment not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment.status == "completed":
            return Response(
                {"detail": "Payment already completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get M-Pesa credentials
        consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        # HIGH-08: Standardized env var name to MPESA_BUSINESS_SHORT_CODE
        business_short_code = os.getenv("MPESA_BUSINESS_SHORT_CODE", "174379")
        passkey = os.getenv("MPESA_PASSKEY")
        callback_url = os.getenv("MPESA_CALLBACK_URL")
        mpesa_env = os.getenv("MPESA_ENV", "sandbox")

        if not all([consumer_key, consumer_secret, passkey]):
            payment.status = "failed"
            payment.save()
            return Response(
                {"detail": "M-Pesa not configured"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # CRIT-04: Callback URL must be HTTPS in production and must not be localhost
        if not callback_url:
            logger.error("MPESA_CALLBACK_URL is not configured")
            return Response(
                {"detail": "M-Pesa callback URL not configured"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if mpesa_env == "live" and "localhost" in callback_url:
            logger.error("MPESA_CALLBACK_URL must not be localhost in production")
            return Response(
                {"detail": "M-Pesa callback URL is not valid for production"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Get access token
        api_url = (
            "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
            if mpesa_env == "live"
            else "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        )

        try:
            resp = requests.get(
                api_url,
                auth=(consumer_key, consumer_secret),
                timeout=30,
            )
            if resp.status_code != 200:
                payment.status = "failed"
                payment.save()
                logger.error("M-Pesa auth failed: %s", resp.text)
                return Response(
                    {"detail": "M-Pesa authentication failed"},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            access_token = resp.json()["access_token"]
        except Exception as e:
            payment.status = "failed"
            payment.save()
            logger.error("M-Pesa auth exception: %s", str(e))
            return Response(
                {"detail": "M-Pesa service unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # STK Push
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(
            f"{business_short_code}{passkey}{timestamp}".encode()
        ).decode()

        stk_url = (
            "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
            if mpesa_env == "live"
            else "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        )

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        payload = {
            "BusinessShortCode": business_short_code,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": str(int(payment.amount)),
            "PartyA": phone,
            "PartyB": business_short_code,
            "PhoneNumber": phone,
            "CallBackURL": callback_url,
            "AccountReference": f"ORDER{payment.order.id}",
            "TransactionDesc": f"Payment for Order {payment.order.id}",
        }

        try:
            resp = requests.post(stk_url, json=payload, headers=headers, timeout=30)
            result = resp.json()

            if resp.status_code == 200:
                if result.get("ResponseCode") == "0":
                    checkout_request_id = result.get("CheckoutRequestID")
                    payment.checkout_request_id = checkout_request_id
                    payment.phone = phone
                    payment.save()

                    # CRIT-01: Fixed — task only takes payment_id, not checkout_request_id
                    verify_mpesa_payment_async.delay(payment.id)

                    return Response(
                        {
                            "detail": "STK initiated",
                            "checkout_request_id": checkout_request_id,
                        }
                    )
                else:
                    payment.status = "failed"
                    payment.save()
                    return Response(
                        {
                            "detail": result.get(
                                "ResponseDescription", "STK push failed"
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                payment.status = "failed"
                payment.save()
                logger.error("M-Pesa STK failed: %s", result)
                return Response(
                    {"detail": "STK push request failed"},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

        except Exception as e:
            payment.status = "failed"
            payment.save()
            logger.error("M-Pesa STK exception: %s", str(e))
            return Response(
                {"detail": "M-Pesa service error"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class MpesaInitiateAndPushView(APIView):
    """
    CRIT-10: Consolidated endpoint — creates Payment record AND triggers STK push
    in a single request. Frontend only needs to call this one endpoint with order_id.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        phone = request.data.get("phone")

        if not order_id or not phone:
            return Response(
                {"detail": "order_id and phone are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = Order.objects.filter(pk=order_id, user=request.user).first()
        if not order:
            return Response(
                {"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if order.status != "pending":
            return Response(
                {"detail": "Order not in pending state"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Normalize phone to 254XXXXXXXXX format
        phone_norm = phone.replace("+254", "").replace(" ", "").replace("-", "")
        if phone_norm.startswith("0"):
            phone_norm = "254" + phone_norm[1:]
        elif not phone_norm.startswith("254"):
            phone_norm = "254" + phone_norm

        # Get or create payment record
        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={
                "amount": order.total,
                "payment_method": "mpesa",
                "phone": phone_norm,
                "status": "initiated",
            },
        )

        if payment.status == "completed":
            return Response(
                {"detail": "Payment already completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update phone on existing payment
        if payment.phone != phone_norm:
            payment.phone = phone_norm
            payment.save(update_fields=["phone"])

        # Get M-Pesa credentials
        consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        business_short_code = os.getenv("MPESA_BUSINESS_SHORT_CODE", "174379")
        passkey = os.getenv("MPESA_PASSKEY")
        callback_url = os.getenv("MPESA_CALLBACK_URL")
        mpesa_env = os.getenv("MPESA_ENV", "sandbox")

        if not all([consumer_key, consumer_secret, passkey, callback_url]):
            payment.status = "failed"
            payment.save()
            return Response(
                {"detail": "M-Pesa not configured. Please contact support."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if mpesa_env == "live" and "localhost" in callback_url:
            logger.error("MPESA_CALLBACK_URL must not be localhost in production")
            return Response(
                {"detail": "Payment configuration error. Please contact support."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Get access token
        token_url = (
            "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
            if mpesa_env == "live"
            else "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        )

        try:
            token_resp = requests.get(
                token_url, auth=(consumer_key, consumer_secret), timeout=30
            )
            if token_resp.status_code != 200:
                payment.status = "failed"
                payment.save()
                logger.error("M-Pesa auth failed: %s", token_resp.text)
                return Response(
                    {"detail": "M-Pesa authentication failed"},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            access_token = token_resp.json()["access_token"]
        except Exception as e:
            payment.status = "failed"
            payment.save()
            logger.error("M-Pesa auth exception: %s", str(e))
            return Response(
                {"detail": "M-Pesa service unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Build STK push
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(
            f"{business_short_code}{passkey}{timestamp}".encode()
        ).decode()

        stk_url = (
            "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
            if mpesa_env == "live"
            else "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        )

        stk_payload = {
            "BusinessShortCode": business_short_code,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": str(int(payment.amount)),
            "PartyA": phone_norm,
            "PartyB": business_short_code,
            "PhoneNumber": phone_norm,
            "CallBackURL": callback_url,
            "AccountReference": f"ORDER{order.id}",
            "TransactionDesc": f"Malaika Nest Order {order.id}",
        }

        try:
            stk_resp = requests.post(
                stk_url,
                json=stk_payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            result = stk_resp.json()

            if stk_resp.status_code == 200 and result.get("ResponseCode") == "0":
                checkout_request_id = result.get("CheckoutRequestID")
                payment.checkout_request_id = checkout_request_id
                payment.save()

                # Schedule background verification (CRIT-01: corrected — only pass payment_id)
                verify_mpesa_payment_async.delay(payment.id)

                return Response({
                    "detail": "STK push initiated. Check your phone for M-Pesa prompt.",
                    "checkout_request_id": checkout_request_id,
                    "order_id": order.id,
                })
            else:
                payment.status = "failed"
                payment.save()
                logger.error("M-Pesa STK failed for order %s: %s", order.id, result)
                return Response(
                    {"detail": result.get("ResponseDescription", "STK push failed")},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            payment.status = "failed"
            payment.save()
            logger.error("M-Pesa STK exception for order %s: %s", order.id, str(e))
            return Response(
                {"detail": "M-Pesa service error. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


@method_decorator(csrf_exempt, name='dispatch')
class MpesaCallbackView(APIView):
    """
    HIGH-07: @csrf_exempt applied — Safaricom servers are not in CSRF trusted origins.
    AllowAny is correct — but IP validation enforces only Safaricom IPs can use it.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Get client IP
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.META.get("REMOTE_ADDR")

        # CRIT-04: Removed localhost bypass — only Safaricom IPs allowed in production
        # In sandbox/dev mode, allow all IPs for testing
        mpesa_env = os.getenv("MPESA_ENV", "sandbox")
        is_safaricom = is_valid_mpesa_ip(client_ip)

        logger.info(
            "M-Pesa callback from IP: %s, env: %s, is_safaricom: %s",
            client_ip, mpesa_env, is_safaricom
        )

        if mpesa_env == "live" and not is_safaricom:
            logger.warning("Blocked M-Pesa callback from unauthorized IP: %s", client_ip)
            return JsonResponse({"ResultCode": 1, "ResultDesc": "Unauthorized"}, status=200)

        raw = request.data

        checkout_id = (
            raw.get("Body", {}).get("stkCallback", {}).get("CheckoutRequestID")
        )
        with transaction.atomic():
            payment = None
            if checkout_id:
                payment = (
                    Payment.objects.select_for_update()
                    .filter(checkout_request_id=checkout_id)
                    .first()
                )
            if not payment:
                merchant_request_id = (
                    raw.get("Body", {}).get("stkCallback", {}).get("MerchantRequestID")
                )
                if merchant_request_id:
                    payment = (
                        Payment.objects.select_for_update()
                        .filter(order__receipt_number=merchant_request_id)
                        .first()
                    )

            if not payment:
                # Store for manual reconciliation
                Payment.objects.create(
                    amount=0, phone="", raw_callback=raw, status="failed"
                )
                logger.warning("M-Pesa callback with no matching payment: %s", raw)
                return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"}, status=200)

            # Prevent duplicate processing
            if payment.status == "completed":
                payment.raw_callback = raw
                payment.save(update_fields=["raw_callback", "updated_at"])
                logger.info("Duplicate callback for payment %s", payment.id)
                return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"}, status=200)

            payment.raw_callback = raw
            callback_result = raw.get("Body", {}).get("stkCallback", {})
            result_code = callback_result.get("ResultCode")
            callback_metadata = callback_result.get("CallbackMetadata", {})

            if result_code == 0:
                items = {
                    it.get("Name"): it.get("Value")
                    for it in callback_metadata.get("Item", [])
                }
                receipt = items.get("MpesaReceiptNumber")
                amount = items.get("Amount")
                callback_phone = items.get("PhoneNumber")

                # Validate amount matches order
                from decimal import Decimal, InvalidOperation
                try:
                    if Decimal(str(amount)) != payment.amount:
                        payment.status = "failed"
                        payment.save()
                        logger.error(
                            "Amount mismatch for payment %s: expected %s got %s",
                            payment.id, payment.amount, amount,
                        )
                        return JsonResponse({"ResultCode": 1, "ResultDesc": "Amount mismatch"}, status=200)
                except (InvalidOperation, TypeError):
                    payment.status = "failed"
                    payment.save()
                    return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid amount"}, status=200)

                # CRIT-05: Enforce phone match (normalize before comparing)
                order_phone = None
                if payment.order.user and hasattr(payment.order.user, "phone"):
                    order_phone = payment.order.user.phone
                elif payment.phone:
                    order_phone = payment.phone

                if order_phone and callback_phone:
                    def normalize_phone(p):
                        return (
                            str(p).replace("+254", "254")
                            .replace(" ", "")
                            .replace("-", "")
                            .lstrip("0")
                        )
                    order_phone_norm = normalize_phone(order_phone)
                    callback_phone_norm = normalize_phone(callback_phone)

                    if order_phone_norm != callback_phone_norm:
                        # Log and flag but don't hard-fail — could be a legitimate
                        # third-party payment on behalf of recipient.
                        # Store mismatch for manual review.
                        logger.warning(
                            "Phone mismatch for payment %s: order phone %s, callback phone %s. "
                            "Flagging for manual review.",
                            payment.id, order_phone, callback_phone,
                        )
                        # Store note in raw_callback for auditors
                        raw["_phone_mismatch"] = True
                        raw["_order_phone"] = str(order_phone)
                        raw["_callback_phone"] = str(callback_phone)
                        payment.raw_callback = raw
                        # Payment is accepted but flagged — real money was received
                        # Admin should review phone mismatch payments

                payment.mpesa_receipt_number = receipt
                payment.phone = callback_phone
                payment.status = "completed"
                payment.save()

                # Update order status
                order = payment.order
                order.status = "paid"
                order.paid_at = datetime.datetime.now()
                order.save()

                logger.info(
                    "Payment completed for order %s, receipt: %s",
                    order.id, receipt,
                )

                return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})

            else:
                result_desc = callback_result.get("ResultDesc", "Unknown error")
                payment.status = "failed"
                payment.save()

                payment.order.status = "payment_failed"
                payment.order.save()

                logger.error(
                    "Payment failed for order %s: ResultCode=%s, Desc=%s",
                    payment.order.id, result_code, result_desc,
                )
                return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})


@method_decorator(csrf_exempt, name='dispatch')
class PayPalCallbackView(APIView):
    """
    LOW-06: Stub disabled — returns 501 until properly implemented.
    Previously returned 200 on anything POSTed, silently losing all data.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger.info("PayPal callback received but PayPal is not yet implemented: %s", request.data)
        return JsonResponse(
            {"detail": "PayPal payments are not currently supported"},
            status=501,
        )


@method_decorator(csrf_exempt, name='dispatch')
class CardCallbackView(APIView):
    """
    LOW-06: Stub disabled — returns 501 until properly implemented.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger.info("Card callback received but card payments are not yet implemented: %s", request.data)
        return JsonResponse(
            {"detail": "Card payments are not currently supported"},
            status=501,
        )
