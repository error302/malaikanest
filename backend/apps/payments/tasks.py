import os
import base64
import datetime
import requests
import logging
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger("apps.payments")

try:
    from celery import shared_task
except ImportError:
    def shared_task(func=None, **kwargs):
        if func is not None:
            return func
        def decorator(f):
            return f
        return decorator


@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def verify_mpesa_payment_async(self, payment_id):
    """
    CRIT-01: Fixed — task signature now only takes payment_id (was incorrectly called
              with payment_id + checkout_request_id causing TypeError on every call).
    CRIT-08: Fixed — now respects MPESA_ENV (was hardcoded to live API).
    HIGH-05: Fixed — timestamp is now properly generated (was empty string, causing
              every Safaricom query to be rejected with malformed password).
    """
    from .models import Payment

    try:
        payment = Payment.objects.get(pk=payment_id)
    except Payment.DoesNotExist:
        logger.warning("verify_mpesa_payment_async: payment %s not found", payment_id)
        return "not found"

    if payment.status == "completed":
        return "already completed"

    if not payment.checkout_request_id:
        logger.warning("verify_mpesa_payment_async: payment %s has no checkout_request_id", payment_id)
        return "no checkout_request_id"

    consumer_key = os.getenv("MPESA_CONSUMER_KEY")
    consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
    # HIGH-08: Standardized env var name
    shortcode = os.getenv("MPESA_BUSINESS_SHORT_CODE", "174379")
    passkey = os.getenv("MPESA_PASSKEY")
    # CRIT-08: Respect MPESA_ENV — was hardcoded to live API
    mpesa_env = os.getenv("MPESA_ENV", "sandbox")

    if not all([consumer_key, consumer_secret, shortcode, passkey]):
        logger.error("verify_mpesa_payment_async: M-Pesa not fully configured")
        return "not configured"

    # CRIT-08: Select correct API URL based on environment
    token_url = (
        "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        if mpesa_env == "live"
        else "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    )
    query_url = (
        "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query"
        if mpesa_env == "live"
        else "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query"
    )

    try:
        token_resp = requests.get(
            token_url,
            auth=(consumer_key, consumer_secret),
            timeout=10,
        )
        token_resp.raise_for_status()
        access_token = token_resp.json().get("access_token")
    except requests.exceptions.RequestException as exc:
        logger.error("verify_mpesa_payment_async: token fetch failed for payment %s: %s", payment_id, exc)
        raise self.retry(exc=exc)

    # HIGH-05: Fixed — timestamp must be YYYYMMDDHHMMSS, was empty string breaking password
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(
        f"{shortcode}{passkey}{timestamp}".encode()
    ).decode()

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "BusinessShortCode": shortcode,
        "CheckoutRequestID": payment.checkout_request_id,
        "Password": password,
        "Timestamp": timestamp,
    }

    try:
        resp = requests.post(query_url, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        logger.info("STK query result for payment %s: %s", payment_id, data)

        result_code = data.get("ResultCode")
        # Safaricom may return int or string
        if result_code == "0" or result_code == 0:
            with transaction.atomic():
                p = Payment.objects.select_for_update().get(pk=payment_id)
                if p.status != "completed":
                    p.status = "completed"
                    # Note: STK query doesn't return MpesaReceiptNumber — that comes from callback
                    p.save()
                    order = p.order
                    if order.status != "paid":
                        order.status = "paid"
                        order.paid_at = timezone.now()
                        order.save()
            logger.info("Payment %s verified and marked completed via query", payment_id)
            return "completed"
        else:
            result_desc = data.get("ResultDesc", "")
            logger.info(
                "Payment %s verification query: not yet completed — ResultCode=%s, Desc=%s",
                payment_id, result_code, result_desc,
            )
            # If still pending, retry
            raise self.retry()

    except requests.exceptions.RequestException as exc:
        logger.error("verify_mpesa_payment_async: query failed for payment %s: %s", payment_id, exc)
        raise self.retry(exc=exc)
    except Payment.DoesNotExist:
        return "not found"


@shared_task
def reconcile_payments_task():
    """
    LOW-09: Fixed — use timezone.now() instead of datetime.utcnow() to avoid
    comparing naive UTC to timezone-aware EAT datetimes.
    """
    from .models import Payment

    # Find payments that have been in "initiated" status for over 30 minutes
    cutoff = timezone.now() - datetime.timedelta(minutes=30)
    payments = Payment.objects.filter(status="initiated", created_at__lt=cutoff)
    count = 0
    for p in payments:
        try:
            verify_mpesa_payment_async.delay(p.id)
            count += 1
        except Exception as e:
            logger.error("reconcile_payments_task: failed to queue payment %s: %s", p.id, e)
            continue
    logger.info("reconcile_payments_task: queued %s payments for verification", count)
    return f"queued {count}"
