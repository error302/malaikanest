"""Celery tasks for the accounts app — async email dispatch."""

import logging

from apps.core.email_service import EmailService

logger = logging.getLogger("apps.accounts")

try:
    from celery import shared_task
except ImportError:
    def shared_task(func=None, **kwargs):
        if func is not None:
            return func
        def decorator(f):
            return f
        return decorator


@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,), retry_backoff=True)
def send_verification_email_task(self, email: str, verify_url: str, first_name: str = "") -> str:
    """Send a brand-matching verification email asynchronously via Celery.

    `verify_url` is pre-built by AuthService so all frontend-URL fallback
    logic (settings.FRONTEND_URL, SITE_URL, CORS_ALLOWED_ORIGINS, etc.)
    lives in one place.
    """
    ok, msg = EmailService.send_verification(email, verify_url, first_name)
    if ok:
        return "sent"
    logger.error("Verification email failed to %s: %s", email, msg)
    raise Exception(msg)
