import datetime
import logging

from django.utils import timezone
from apps.core import metrics
from apps.core.circuit_breaker import CircuitOpen

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


@shared_task
def verify_mpesa_payment_async(payment_id):
    from .mpesa_verification import verify_payment

    return verify_payment(payment_id)


@shared_task(bind=True, max_retries=3, default_retry_delay=60, acks_late=True, reject_on_worker_lost=True)
def verify_pesapal_payment_async(self, payment_id):
    from .models import Payment
    from .pesapal import PesapalService, PesapalError
    from .services import audit_log

    try:
        payment = Payment.objects.get(pk=payment_id)
    except Payment.DoesNotExist:
        logger.warning("verify_pesapal_payment_async: payment %s not found", payment_id)
        return "not found"

    if payment.payment_method != "pesapal":
        return "unsupported method"

    if payment.status == "completed":
        return "already completed"

    if not payment.pesapal_tracking_id:
        audit_log(
            payment=payment,
            event_type="reconcile_query",
            payload={"reason": "missing_tracking_id", "payment_id": payment.id},
            notes="Cannot reconcile Pesapal payment without tracking id",
            source="celery",
        )
        return "no tracking id"

    try:
        status_resp = PesapalService.get_transaction_status(payment.pesapal_tracking_id)
    except CircuitOpen as exc:
        audit_log(
            payment=payment,
            event_type="reconcile_query",
            payload={"stage": "status", "error": str(exc)},
            notes="Pesapal breaker open — skipping reconcile",
            source="celery",
        )
        return "breaker open"
    except PesapalError as exc:
        audit_log(
            payment=payment,
            event_type="reconcile_query",
            payload={"stage": "status", "error": str(exc)},
            notes="Pesapal status query failed",
            source="celery",
        )
        metrics.incr("payments.failed")
        raise self.retry(exc=exc)
    except Exception as exc:
        audit_log(
            payment=payment,
            event_type="reconcile_query",
            payload={"stage": "status", "error": str(exc)},
            notes="Pesapal status query failed",
            source="celery",
        )
        metrics.incr("payments.failed")
        raise self.retry(exc=exc)

    result = PesapalService.apply_status(payment, status_resp, source="celery")
    if result == "initiated":
        # Still pending — try again later.
        raise self.retry()
    return result


@shared_task
def process_mpesa_query_queue():
    from django.core.management import call_command

    call_command("process_mpesa_queries")


@shared_task
def reconcile_payments_task(stale_minutes=30, limit=200):
    from .models import Payment
    from .services import audit_log
    from .mpesa_verification import schedule_verification

    cutoff = timezone.now() - datetime.timedelta(minutes=stale_minutes)
    payments = (
        Payment.objects.filter(payment_method__in=["mpesa", "pesapal"], status="initiated", created_at__lt=cutoff)
        .exclude(mpesa_checkout_request_id__isnull=True, pesapal_tracking_id__isnull=True)
        .order_by("created_at")[:limit]
    )

    queued = 0
    for p in payments:
        try:
            if p.payment_method == "pesapal":
                verify_pesapal_payment_async.delay(p.id)
            else:
                schedule_verification(Payment.objects.filter(pk=p.pk))
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
