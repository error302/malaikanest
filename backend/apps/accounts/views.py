from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from django.conf import settings
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.html import strip_tags
from django.contrib.auth import authenticate
from .serializers import UserSerializer, RegisterSerializer
from .models import User
from .security import (
    clear_login_failures,
    get_client_ip,
    is_login_locked,
    log_auth_event,
    register_login_failure,
)
from apps.core.captcha import CaptchaError, require_captcha
import logging
import datetime


logger = logging.getLogger("apps.accounts")


class CookieTokenObtainPairView(TokenObtainPairView):
    """Returns access token in body and sets refresh and access tokens in httpOnly secure cookies"""

    def finalize_response(self, request, response, *args, **kwargs):
        return super().finalize_response(request, response, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        email = (request.data.get("email") or request.data.get("username") or "").strip().lower()
        ip = get_client_ip(request)
        ua = request.META.get("HTTP_USER_AGENT", "")

        try:
            require_captcha(
                request,
                action="login",
                enforce=bool(getattr(settings, "CAPTCHA_ENFORCE_LOGIN", False)),
            )
        except CaptchaError as exc:
            log_auth_event("captcha_failed", email=email, ip=ip, user_agent=ua, reason=str(exc))
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if email and is_login_locked(email, ip):
            log_auth_event("login_blocked_locked", email=email, ip=ip, user_agent=ua)
            return Response(
                {"detail": "Account temporarily locked after repeated failed attempts. Try again later."},
                status=status.HTTP_423_LOCKED,
            )

        resp = super().post(request, *args, **kwargs)

        if resp.status_code >= 400:
            register_login_failure(
                email=email or "unknown",
                ip=ip,
                user_agent=ua,
                reason=str(getattr(resp, "data", {}).get("detail", "invalid_credentials")),
            )
            return resp

        clear_login_failures(email=email, ip=ip)
        log_auth_event("login_success", email=email, ip=ip, user_agent=ua)

        try:
            refresh = resp.data.get("refresh")
            access = resp.data.get("access")

            if refresh:
                max_age = int(
                    settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME", 86400).total_seconds()
                    if hasattr(settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME"), "total_seconds")
                    else settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME", 86400)
                )
                expires = datetime.datetime.utcnow() + datetime.timedelta(seconds=max_age)
                resp.set_cookie(
                    settings.SIMPLE_JWT.get("AUTH_COOKIE", "refresh_token"),
                    refresh,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite="Lax",
                    expires=expires,
                )

            if access:
                max_access_age = int(
                    settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME", 300).total_seconds()
                    if hasattr(settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME"), "total_seconds")
                    else settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME", 300)
                )
                expires_access = datetime.datetime.utcnow() + datetime.timedelta(seconds=max_access_age)
                resp.set_cookie(
                    "access_token",
                    access,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite="Lax",
                    expires=expires_access,
                )

            # Remove tokens from body — they are now in HTTPOnly cookies only
            resp.data.pop("refresh", None)
            resp.data.pop("access", None)
        except Exception:
            pass
        return resp


class CookieTokenRefreshView(APIView):
    """Refresh JWT using httpOnly refresh cookie (or body fallback), then rotate cookies."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from rest_framework_simplejwt.exceptions import TokenError

        refresh_value = request.COOKIES.get(settings.SIMPLE_JWT.get("AUTH_COOKIE", "refresh_token"))
        if not refresh_value:
            refresh_value = request.data.get("refresh")

        if not refresh_value:
            return Response({"detail": "Refresh token missing"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(refresh_value)
            user_id = refresh.get("user_id")
            user = User.objects.get(id=user_id)

            new_refresh = RefreshToken.for_user(user)
            access = str(new_refresh.access_token)

            resp = Response({"detail": "Token refreshed"}, status=status.HTTP_200_OK)

            refresh_max_age = int(settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME", datetime.timedelta(days=30)).total_seconds())
            access_max_age = int(settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME", datetime.timedelta(minutes=15)).total_seconds())
            refresh_expires = datetime.datetime.utcnow() + datetime.timedelta(seconds=refresh_max_age)
            access_expires = datetime.datetime.utcnow() + datetime.timedelta(seconds=access_max_age)

            resp.set_cookie(
                settings.SIMPLE_JWT.get("AUTH_COOKIE", "refresh_token"),
                str(new_refresh),
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                expires=refresh_expires,
            )
            resp.set_cookie(
                "access_token",
                access,
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                expires=access_expires,
            )

            try:
                refresh.blacklist()
            except Exception:
                pass

            return resp
        except (TokenError, User.DoesNotExist, Exception):
            return Response({"detail": "Invalid refresh token"}, status=status.HTTP_401_UNAUTHORIZED)


class ResendVerificationThrottle(AnonRateThrottle):
    rate = "3/hour"
    scope = "resend_verification"


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        ip = get_client_ip(request)
        ua = request.META.get("HTTP_USER_AGENT", "")

        try:
            require_captcha(
                request,
                action="register",
                enforce=bool(getattr(settings, "CAPTCHA_ENFORCE_REGISTER", False)),
            )
        except CaptchaError as exc:
            log_auth_event("register_captcha_failed", email=request.data.get("email", ""), ip=ip, user_agent=ua, reason=str(exc))
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save(is_active=False)

        token = get_random_string(64)
        user.verification_token = token
        user.verification_token_expires = timezone.now() + timezone.timedelta(hours=24)
        user.save()

        email_sent = self._send_verification_email(user, token)

        log_auth_event("register_success", email=user.email, ip=ip, user_agent=ua, email_sent=email_sent)

        response_data = {
            "message": "Registration successful. Please check your email to verify your account.",
            "user_id": user.id,
        }
        if not email_sent:
            response_data["warning"] = (
                "Account created but verification email could not be sent. "
                "Use the resend verification endpoint to try again."
            )

        return Response(response_data, status=status.HTTP_201_CREATED)

    def _send_verification_email(self, user, token):
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


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def verify_email_view(request):
    token = request.data.get("token")

    if not token:
        return Response({"detail": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(verification_token=token)

        if user.is_active:
            return Response({"detail": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST)

        if user.verification_token_expires and user.verification_token_expires < timezone.now():
            return Response({"detail": "Verification link has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.email_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        user.save()

        return Response({"message": "Email verified successfully! You can now login.", "success": True})
    except User.DoesNotExist:
        return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([ResendVerificationThrottle])
def resend_verification_view(request):
    email = request.data.get("email")

    if not email:
        return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        if not user.is_active:
            token = get_random_string(64)
            user.verification_token = token
            user.verification_token_expires = timezone.now() + timezone.timedelta(hours=24)
            user.save()

            rv = RegisterView()
            rv._send_verification_email(user, token)
    except User.DoesNotExist:
        pass

    return Response({"message": "If your email is registered and unverified, a new verification link has been sent."})


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    refresh_value = request.data.get("refresh") or request.COOKIES.get(settings.SIMPLE_JWT.get("AUTH_COOKIE", "refresh_token"))
    if refresh_value:
        try:
            RefreshToken(refresh_value).blacklist()
        except Exception as e:
            logger.warning("Logout token blacklist failed: %s", e)

    resp = Response({"detail": "Logged out"})
    resp.delete_cookie("access_token")
    resp.delete_cookie(settings.SIMPLE_JWT.get("AUTH_COOKIE", "refresh_token"))
    return resp


def _is_email_configured():
    return all([
        getattr(settings, "EMAIL_HOST", None),
        getattr(settings, "EMAIL_HOST_USER", None),
        getattr(settings, "EMAIL_HOST_PASSWORD", None),
        getattr(settings, "DEFAULT_FROM_EMAIL", None),
    ])


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_request_view(request):
    if not _is_email_configured():
        logger.error("Email not configured. Missing EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, or DEFAULT_FROM_EMAIL")
        return Response({"detail": "Password reset is not configured. Please contact support."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    email = request.data.get("email")
    if not email:
        return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"detail": "If the email exists, a reset link has been sent."})

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
        return Response({"detail": "Failed to send reset email. Please try again later."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response({"detail": "If the email exists, a reset link has been sent."})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_confirm_view(request):
    token = request.data.get("token")
    new_password = request.data.get("new_password")

    if not token or not new_password:
        return Response({"detail": "Token and new password are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(password_reset_token=token)
    except User.DoesNotExist:
        return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

    if not user.password_reset_expires or user.password_reset_expires < timezone.now():
        return Response({"detail": "Token has expired"}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.save()

    return Response({"detail": "Password has been reset successfully."})



class AdminCookieTokenObtainPairView(CookieTokenObtainPairView):
    """Admin-only login endpoint."""

    def post(self, request, *args, **kwargs):
        email = (request.data.get("email") or request.data.get("username") or "").strip().lower()
        password = request.data.get("password")

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({"detail": "No active account found with the given credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        is_admin = bool(getattr(user, "is_staff", False) or getattr(user, "role", "") == "admin")
        if not is_admin:
            return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

        return super().post(request, *args, **kwargs)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_session_view(request):
    user = request.user
    is_admin = bool(getattr(user, "is_staff", False) or getattr(user, "role", "") == "admin")
    if not is_admin:
        return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    return Response(
        {
            "id": user.id,
            "email": user.email,
            "role": getattr(user, "role", "customer"),
            "is_staff": bool(getattr(user, "is_staff", False)),
        }
    )
