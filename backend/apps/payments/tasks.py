import base64
import datetime
import hashlib
import json
import logging
import os

import requests
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

from .services import audit_log


@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def verify_mpesa_payment_async(self, payment_id):
    from .models import Payment

    try:
        payment = Payment.objects.get(pk=payment_id)
    except Payment.DoesNotExist:
        logger.warning("verify_mpesa_payment_async: payment %s not found", payment_id)
        return "not found"

    if payment.payment_method != "mpesa":
        return "unsupported method"

    if payment.status == "completed":
        return "already completed"

    if not payment.checkout_request_id:
        audit_log(
            payment=payment,
            event_type="reconcile_query",
            payload={"reason": "missing_checkout_request_id", "payment_id": payment.id},
            notes="Cannot reconcile payment without checkout_request_id",
            source="celery"
        )
        return "no checkout_request_id"

    consumer_key = os.getenv("MPESA_CONSUMER_KEY")
    consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
    shortcode = os.getenv("MPESA_BUSINESS_SHORT_CODE", "174379")
    passkey = os.getenv("MPESA_PASSKEY")
    mpesa_env = os.getenv("MPESA_ENV", "sandbox")

    if not all([consumer_key, consumer_secret, shortcode, passkey]):
        audit_log(
            payment=payment,
            event_type="reconcile_query",
            payload={"reason": "missing_mpesa_config", "payment_id": payment.id},
            notes="M-Pesa credentials not fully configured",
            source="celery"
        )
        return "not configured"

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
        token_resp = requests.get(token_url, auth=(consumer_key, consumer_secret), timeout=10)
        token_resp.raise_for_status()
        access_token = token_resp.json().get("access_token")
    except requests.exceptions.RequestException as exc:
        audit_log(
            payment=payment,
            event_type="reconcile_query",
            payload={"stage": "token", "error": str(exc)},
            checkout_request_id=payment.checkout_request_id,
            notes="Token fetch failed",
            source="celery"
        )
        raise self.retry(exc=exc)

    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()

    payload = {
        "BusinessShortCode": shortcode,
        "CheckoutRequestID": payment.checkout_request_id,
        "Password": password,
        "Timestamp": timestamp,
    }

    try:
        resp = requests.post(
            query_url,
            json=payload,
            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        result_code = data.get("ResultCode")

        audit_log(
            payment=payment,
            event_type="reconcile_query",
            payload={"request": {**payload, "Password": "***"}, "response": data},
            checkout_request_id=payment.checkout_request_id,
            result_code=str(result_code) if result_code is not None else None,
            source="celery"
        )

        if result_code == "0" or result_code == 0:
            with transaction.atomic():
                p = Payment.objects.select_for_update().get(pk=payment_id)
                if p.status != "completed":
                    p.status = "completed"
                    p.save(update_fields=["status", "updated_at"])
                    order = p.order
                    if order.status != "paid":
                        order.status = "paid"
                        if hasattr(order, "paid_at"):
                            order.paid_at = timezone.now()
                            order.save(update_fields=["status", "paid_at", "updated_at"])
                        else:
                            order.save(update_fields=["status", "updated_at"])

                    audit_log(
                        payment=p,
                        event_type="reconcile_completed",
                        payload={"payment_id": p.id, "order_id": p.order_id},
                        checkout_request_id=p.checkout_request_id,
                        result_code="0",
                        notes="Recovered payment via STK query reconciliation",
                        source="celery"
                    )
            return "completed"

        raise self.retry()

    except requests.exceptions.RequestException as exc:
        audit_log(
            payment=payment,
            event_type="reconcile_query",
            payload={"stage": "query", "error": str(exc)},
            checkout_request_id=payment.checkout_request_id,
            notes="STK query failed",
            source="celery"
        )
        raise self.retry(exc=exc)
    except Payment.DoesNotExist:
        return "not found"


@shared_task
def reconcile_payments_task(stale_minutes=30, limit=200):
    from .models import Payment

    cutoff = timezone.now() - datetime.timedelta(minutes=stale_minutes)
    payments = (
        Payment.objects.filter(payment_method="mpesa", status="initiated", created_at__lt=cutoff)
        .exclude(checkout_request_id__isnull=True)
        .exclude(checkout_request_id="")
        .order_by("created_at")[:limit]
    )

    queued = 0
    for p in payments:
        try:
            verify_mpesa_payment_async.delay(p.id)
            queued += 1
            audit_log(
                payment=p,
                event_type="reconcile_queued",
                payload={"payment_id": p.id, "stale_minutes": stale_minutes},
                checkout_request_id=p.checkout_request_id,
                notes="Queued by reconcile_payments_task",
                source="celery"
            )
        except Exception as exc:
            logger.error("reconcile_payments_task: failed to queue payment %s: %s", p.id, exc)

    logger.info("reconcile_payments_task: queued %s payments", queued)
    return f"queued {queued}"
