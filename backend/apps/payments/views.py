import os
import base64
import datetime
import logging
import requests
from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
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
    "41.89.0.0/16",  # Safaricom
    "41.86.0.0/16",  # Safaricom
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

        payment = Payment.objects.create(
            order=order,
            amount=order.total,
            payment_method=payment_method,
            phone=request.data.get("phone"),
            status="initiated",
        )

        if payment_method == "mpesa":
            return Response({"payment_id": payment.id, "payment_method": "mpesa"})
        elif payment_method == "paypal":
            return Response(self._create_paypal_order(payment))
        elif payment_method == "card":
            return Response(self._create_card_session(payment))

    def _create_paypal_order(self, payment):
        paypal_client_id = os.getenv("PAYPAL_CLIENT_ID")
        paypal_secret = os.getenv("PAYPAL_SECRET")

        if not paypal_client_id or not paypal_secret:
            payment.status = "failed"
            payment.save()
            return {"detail": "PayPal not configured"}

        auth_url = "https://api-m.sandbox.paypal.com/v1/oauth2/token"
        resp = requests.post(
            auth_url,
            auth=(paypal_client_id, paypal_secret),
            data={"grant_type": "client_credentials"},
        )
        if resp.status_code != 200:
            payment.status = "failed"
            payment.save()
            return {"detail": "PayPal auth failed"}

        access_token = resp.json()["access_token"]
        order_url = "https://api-m.sandbox.paypal.com/v2/checkout/orders"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": str(payment.id),
                    "amount": {
                        "currency_code": "USD",
                        "value": str(float(payment.amount) / 140),
                    },
                }
            ],
        }
        resp = requests.post(order_url, headers=headers, json=payload)
        if resp.status_code != 200:
            payment.status = "failed"
            payment.save()
            return {"detail": "PayPal order creation failed"}

        payment.paypal_order_id = resp.json()["id"]
        payment.save()
        return {"id": resp.json()["id"], "status": resp.json()["status"]}

    def _create_card_session(self, payment):
        import uuid

        session_id = str(uuid.uuid4())
        payment.card_session_id = session_id
        payment.save()
        return {"session_id": session_id, "amount": payment.amount}


class MpesaSTKPushView(APIView):
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

        payment = Payment.objects.filter(pk=payment_id, payment_method="mpesa").first()
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
            "CallBackURL": callback_url
            or "http://localhost:8000/api/payments/mpesa/callback/",
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

                    # schedule verification task (in case callback delayed)
                    verify_mpesa_payment_async.delay(payment.id, checkout_request_id)

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


class MpesaCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Get client IP
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.META.get("REMOTE_ADDR")

        # Validate IP - allow localhost for testing, or Safaricom IPs
        is_local = client_ip in ["127.0.0.1", "localhost", "::1"]
        is_safaricom = is_valid_mpesa_ip(client_ip)

        # Log the callback source for monitoring
        logger.info(
            f"M-Pesa callback from IP: {client_ip}, is_safaricom: {is_safaricom}"
        )

        # In production, uncomment this to enforce IP validation:
        # if not is_local and not is_safaricom:
        #     logger.warning(f"Blocked M-Pesa callback from unauthorized IP: {client_ip}")
        #     return JsonResponse({"result": "unauthorized"}, status=403)

        raw = request.data
        # Store raw callback quickly
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
            # If no payment found by checkout id, try to match by account reference / receipt
            if not payment:
                merchant_request_id = (
                    raw.get("Body", {}).get("stkCallback", {}).get("MerchantRequestID")
                )
                payment = (
                    Payment.objects.select_for_update()
                    .filter(order__receipt_number=merchant_request_id)
                    .first()
                )

            if not payment:
                # store payload for manual reconciliation
                Payment.objects.create(
                    amount=0, phone="", raw_callback=raw, status="failed"
                )
                logger.warning("MPESA callback with no matching payment: %s", raw)
                return JsonResponse({"result": "no matching payment"}, status=200)

            # Prevent duplicate processing
            if payment.status == "completed":
                payment.raw_callback = raw
                payment.save(update_fields=["raw_callback", "updated_at"])
                logger.info("Duplicate callback for payment %s", payment.id)
                return JsonResponse({"result": "already processed"}, status=200)

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
                phone = items.get("PhoneNumber")

                # Validate amount matches order
                try:
                    if float(amount) != float(payment.amount):
                        payment.status = "failed"
                        payment.raw_callback = raw
                        payment.save()
                        logger.error(
                            "Amount mismatch for payment %s: expected %s got %s",
                            payment.id,
                            payment.amount,
                            amount,
                        )
                        return JsonResponse({"result": "amount mismatch"}, status=400)
                except Exception:
                    payment.status = "failed"
                    payment.raw_callback = raw
                    payment.save()
                    return JsonResponse({"result": "invalid amount"}, status=400)

                # Validate phone matches order customer
                order_phone = (
                    payment.order.user.phone
                    if hasattr(payment.order.user, "phone")
                    else None
                )
                if order_phone and phone:
                    # Normalize phones for comparison
                    order_phone_clean = (
                        order_phone.replace("+254", "254")
                        .replace(" ", "")
                        .replace("-", "")
                    )
                    phone_clean = (
                        phone.replace("+254", "254").replace(" ", "").replace("-", "")
                    )

                    if order_phone_clean != phone_clean:
                        logger.warning(
                            "Phone mismatch for payment %s: expected %s got %s",
                            payment.id,
                            order_phone,
                            phone,
                        )
                        # Log but don't fail - sometimes phone shows differently

                payment.mpesa_receipt = receipt
                payment.phone = phone
                payment.status = "completed"
                payment.save()

                # Update order status
                payment.order.status = "paid"
                payment.order.payment_status = "completed"
                payment.order.paid_at = datetime.datetime.now()
                payment.order.save()

                logger.info(
                    "Payment completed for order %s, receipt: %s",
                    payment.order.id,
                    receipt,
                )

                return JsonResponse({"result": "success"})

            else:
                result_desc = callback_result.get("ResultDesc", "Unknown error")
                payment.status = "failed"
                payment.raw_callback = raw
                payment.save()

                payment.order.status = "payment_failed"
                payment.order.save()

                logger.error(
                    "Payment failed for order %s: %s - %s",
                    payment.order.id,
                    result_code,
                    result_desc,
                )

                return JsonResponse(
                    {"result": "failed", "reason": result_desc}, status=400
                )


class PayPalCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        pass


class CardCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        pass
