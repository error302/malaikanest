from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.utils.html import strip_tags
import logging

from .models import User
from .serializers import RegisterSerializer
from .security import log_auth_event

logger = logging.getLogger("apps.accounts")

class AuthService:
    @staticmethod
    def send_verification_email(user, token):
        try:
            verify_url = f"{getattr(settings, 'FRONTEND_URL', '')}/verify-email?token={token}"

            html_message = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #8B4513;">Welcome to Malaika Nest!</h2>
                <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                <a href="{verify_url}" style="display: inline-block; background-color: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 16px 0;">Verify Email</a>
                <p>Or copy this link: {verify_url}</p>
                <p>This link expires in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">Malaika Nest - Premium Baby Products in Kenya</p>
            </div>
            """

            plain_message = strip_tags(html_message)

            send_mail(
                subject="Verify Your Email - Malaika Nest",
                message=plain_message,
                html_message=html_message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@malaikanest.com"),
                recipient_list=[user.email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error("Failed to send verification email to %s: %s", user.email, e)
            return False

    @staticmethod
    def register_user(data, ip, user_agent):
        serializer = RegisterSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save(is_active=False)

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

            if user.is_active:
                raise ValueError("Email already verified")

            if user.verification_token_expires and user.verification_token_expires < timezone.now():
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
            if not user.is_active:
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

        reset_url = f"{getattr(settings, 'FRONTEND_URL', '')}/reset-password?token={token}"

        try:
            send_mail(
                subject="Reset Your Password - Malaika Nest",
                message=f"Click here to reset your password: {reset_url}\n\nThis link expires in 24 hours.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error("Failed to send password reset email: %s", e)
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

        if not user.password_reset_expires or user.password_reset_expires < timezone.now():
            raise ValueError("Token has expired")

        user.set_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.save()

        return True
