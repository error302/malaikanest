from django.conf import settings
from django.utils import timezone
from django.utils.crypto import get_random_string
import logging
from urllib.parse import urlencode

from .models import User
from .serializers import RegisterSerializer
from .security import log_auth_event

logger = logging.getLogger("apps.accounts")


def _ensure_aware(dt):
    if not dt:
        return dt
    return timezone.make_aware(dt, timezone.get_current_timezone()) if timezone.is_naive(dt) else dt


def _get_frontend_origin():
    candidates = [
        getattr(settings, "FRONTEND_URL", ""),
        getattr(settings, "SITE_URL", ""),
        *(getattr(settings, "CORS_ALLOWED_ORIGINS", []) or []),
    ]

    allowed_hosts = [host for host in getattr(settings, "ALLOWED_HOSTS", []) if host and host not in {"*", "localhost", "127.0.0.1"}]
    if allowed_hosts:
        candidates.append(f"https://{allowed_hosts[0]}")

    for candidate in candidates:
        value = (candidate or "").strip().rstrip("/")
        if not value:
            continue
        if value.startswith(("http://", "https://")):
            return value
        if "." in value:
            return f"https://{value.lstrip('/')}"

    return "https://malaikanest.com"


def _build_frontend_url(path, **params):
    origin = _get_frontend_origin()
    clean_path = "/" + str(path or "").lstrip("/")
    query = urlencode({key: value for key, value in params.items() if value})
    return f"{origin}{clean_path}" + (f"?{query}" if query else "")


class AuthService:
    @staticmethod
    def _enqueue_verification_email(email, token, first_name):
        """Dispatch the verification email via Celery, falling back to synchronous."""
        verify_url = _build_frontend_url("verify-email", token=token, email=email)

        try:
            from .tasks import send_verification_email_task
            send_verification_email_task.delay(email, verify_url, first_name)
            return True
        except Exception as exc:
            logger.warning(
                "Celery unavailable for verification email, sending synchronously: %s", exc
            )
            from apps.core.email_service import EmailService
            ok, _ = EmailService.send_verification(email, verify_url, first_name)
            return ok

    @staticmethod
    def send_verification_email(user, token):
        return AuthService._enqueue_verification_email(
            user.email, token, getattr(user, "first_name", "")
        )

    @staticmethod
    def register_user(data, ip, user_agent):
        serializer = RegisterSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save(is_active=True)

        token = get_random_string(64)
        user.verification_token = token
        user.verification_token_expires = timezone.now() + timezone.timedelta(hours=24)
        user.save()

        email_sent = AuthService.send_verification_email(user, token)

        log_auth_event("register_success", email=user.email, ip=ip, user_agent=user_agent, email_sent=email_sent)

        return user, email_sent

    @staticmethod
    def verify_email(token):
        if not token:
            raise ValueError("Token is required")

        try:
            user = User.objects.get(verification_token=token)

            if user.is_email_verified:
                raise ValueError("Email already verified")

            expires_at = _ensure_aware(user.verification_token_expires)
            if expires_at and expires_at < timezone.now():
                raise ValueError("Verification link has expired. Please request a new one.")

            user.is_active = True
            user.is_email_verified = True
            user.verification_token = None
            user.verification_token_expires = None
            user.save()

            return True
        except User.DoesNotExist:
            raise ValueError("Invalid token")

    @staticmethod
    def resend_verification_email(email):
        if not email:
            raise ValueError("Email is required")

        try:
            user = User.objects.get(email=email)
            if not user.is_email_verified:
                token = get_random_string(64)
                user.verification_token = token
                user.verification_token_expires = timezone.now() + timezone.timedelta(hours=24)
                user.save()

                AuthService.send_verification_email(user, token)
        except User.DoesNotExist:
            pass

        return True

    @staticmethod
    def is_email_configured():
        return all([
            getattr(settings, "EMAIL_HOST", None),
            getattr(settings, "EMAIL_HOST_USER", None),
            getattr(settings, "EMAIL_HOST_PASSWORD", None),
            getattr(settings, "DEFAULT_FROM_EMAIL", None),
        ])

    @staticmethod
    def request_password_reset(email):
        if not AuthService.is_email_configured():
            logger.error("Email not configured.")
            raise RuntimeError("Password reset is not configured. Please contact support.")

        if not email:
            raise ValueError("Email is required")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return True

        token = get_random_string(64)
        user.password_reset_token = token
        user.password_reset_expires = timezone.now() + timezone.timedelta(hours=24)
        user.save()

        reset_url = _build_frontend_url("reset-password", token=token)

        from apps.core.email_service import EmailService
        ok, msg = EmailService.send_password_reset(email, reset_url)
        if not ok:
            logger.error("Failed to send password reset email: %s", msg)
            raise RuntimeError("Failed to send reset email. Please try again later.")

        return True

    @staticmethod
    def confirm_password_reset(token, new_password):
        if not token or not new_password:
            raise ValueError("Token and new password are required")

        try:
            user = User.objects.get(password_reset_token=token)
        except User.DoesNotExist:
            raise ValueError("Invalid token")

        expires_at = _ensure_aware(user.password_reset_expires)
        if not expires_at or expires_at < timezone.now():
            raise ValueError("Token has expired")

        from .serializers import validate_password_strength
        try:
            validate_password_strength(new_password)
        except Exception as e:
            raise ValueError(str(e))

        user.set_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.save()

        # Invalidate any outstanding refresh tokens (password reset = logout everywhere).
        invalidate_all_user_tokens(user)

        return True
