from celery import shared_task
from django.db import transaction
from django.conf import settings
import os
import requests
from .models import Payment


@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def verify_mpesa_payment_async(self, payment_id):
    try:
        payment = Payment.objects.select_for_update().get(pk=payment_id)
    except Payment.DoesNotExist:
        return 'not found'

    if payment.status == 'completed':
        return 'already completed'

    # Use Daraja TransactionStatus or Query API - best-effort
    try:
        consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
        token_url = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        token_resp = requests.get(token_url, auth=(consumer_key, consumer_secret), timeout=10)
        token_resp.raise_for_status()
        access_token = token_resp.json().get('access_token')

        query_url = 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
        shortcode = os.getenv('MPESA_SHORTCODE')
        passkey = os.getenv('MPESA_PASSKEY')
        timestamp = ''  # timestamp required to build password but not needed for query API in some setups

        password_str = f"{shortcode}{passkey}{''}"
        import base64
        password = base64.b64encode(password_str.encode()).decode()

        headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}
        payload = {
            'BusinessShortCode': shortcode,
            'CheckoutRequestID': payment.checkout_request_id,
            'Password': password,
            'Timestamp': ''
        }

        resp = requests.post(query_url, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        # If success in query
        if data.get('ResultCode') == '0' or data.get('ResultCode') == 0:
            # Mark as completed
            with transaction.atomic():
                p = Payment.objects.select_for_update().get(pk=payment_id)
                if p.status != 'completed':
                    p.status = 'completed'
                    p.mpesa_receipt_number = data.get('CheckoutRequestID') or p.mpesa_receipt_number
                    p.save()
                    order = p.order
                    if order.status != 'paid':
                        order.status = 'paid'
                        order.save()
            return 'completed'
        else:
            # if still pending, retry
            raise self.retry()
    except requests.exceptions.RequestException as exc:
        raise self.retry(exc=exc)
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task
def reconcile_payments_task():
    # Simple reconciliation: find payments with initiated status older than X and flag or retry
    import datetime
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=30)
    payments = Payment.objects.filter(status='initiated', created_at__lt=cutoff)
    for p in payments:
        try:
            verify_mpesa_payment_async.delay(p.id)
        except Exception:
            continue
    return 'ok'
