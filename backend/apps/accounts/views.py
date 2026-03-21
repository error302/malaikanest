import datetime
import logging
import re

import requests
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.core.captcha import CaptchaError, require_captcha

from .models import User, normalize_kenyan_phone
from .security import (
    clear_login_failures,
    get_client_ip,
    is_login_locked,
    log_auth_event,
    register_login_failure,
)
from .serializers import RegisterSerializer, TokenObtainPairWithUserSerializer, UserSerializer
from .services import AuthService

logger = logging.getLogger("apps.accounts")


def _jwt_cookie_secure() -> bool:
    return bool(settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE", not settings.DEBUG))


def _jwt_cookie_samesite() -> str:
    return str(settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE", "Strict"))


def _set_refresh_cookie(resp: Response, refresh_token: str) -> None:
    cookie_domain = getattr(settings, "AUTH_COOKIE_DOMAIN", None)
    lifetime = settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME")
    seconds = int(lifetime.total_seconds()) if hasattr(lifetime, "total_seconds") else int(lifetime or 0)
    expires = datetime.datetime.utcnow() + datetime.timedelta(seconds=seconds or (7 * 24 * 60 * 60))

    resp.set_cookie(
        settings.SIMPLE_JWT.get("AUTH_COOKIE", "refresh_token"),
        refresh_token,
        httponly=True,
        secure=_jwt_cookie_secure(),
        samesite=_jwt_cookie_samesite(),
        expires=expires,
        path="/",
        domain=cookie_domain,
    )


def _clear_refresh_cookie(resp: Response) -> None:
    cookie_domain = getattr(settings, "AUTH_COOKIE_DOMAIN", None)
    resp.delete_cookie(
        settings.SIMPLE_JWT.get("AUTH_COOKIE", "refresh_token"),
        path="/",
        domain=cookie_domain,
    )


class CookieTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint:
    - Returns `access` in response body
    - Sets refresh token as httpOnly cookie
    - Never sets an access token cookie
    """

    serializer_class = TokenObtainPairWithUserSerializer

    def post(self, request, *args, **kwargs):
        email = (request.data.get("email") or request.data.get("username") or "").strip().lower()
        ip = get_client_ip(request)
        ua = request.META.get("HTTP_USER_AGENT", "")

        if email:
            request._log_email = email

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
            if refresh:
                _set_refresh_cookie(resp, refresh)
            # Never return refresh token in body
            resp.data.pop("refresh", None)
        except Exception as exc:
            logger.warning("Failed to set refresh cookie: %s", exc)

        return resp


class CookieTokenRefreshView(APIView):
    """Refresh endpoint reads refresh cookie only; returns access token in body and rotates refresh cookie."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from rest_framework_simplejwt.exceptions import TokenError

        refresh_value = request.COOKIES.get(settings.SIMPLE_JWT.get("AUTH_COOKIE", "refresh_token"))
        if not refresh_value:
            return Response({"detail": "Refresh token missing"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(refresh_value)
            user_id = refresh.get("user_id")
            user = User.objects.get(id=user_id)

            new_refresh = RefreshToken.for_user(user)
            access = str(new_refresh.access_token)

            resp = Response({"access": access}, status=status.HTTP_200_OK)
            _set_refresh_cookie(resp, str(new_refresh))

            try:
                refresh.blacklist()
            except Exception as exc:
                logger.warning("Refresh token blacklist failed: %s", exc)

            return resp
        except TokenError:
            return Response({"detail": "Invalid refresh token"}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
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

        email = request.data.get("email", "")
        if email:
            request._log_email = email

        try:
            require_captcha(
                request,
                action="register",
                enforce=bool(getattr(settings, "CAPTCHA_ENFORCE_REGISTER", False)),
            )
        except CaptchaError as exc:
            log_auth_event(
                "register_captcha_failed",
                email=request.data.get("email", ""),
                ip=ip,
                user_agent=ua,
                reason=str(exc),
            )
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        user, email_sent = AuthService.register_user(request.data, ip, ua)

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


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def verify_email_view(request):
    token = request.data.get("token")
    if not token:
        return Response({"detail": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        AuthService.verify_email(token)
        return Response({"message": "Email verified successfully! You can now login.", "success": True})
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([ResendVerificationThrottle])
def resend_verification_view(request):
    email = request.data.get("email")

    if not email:
        return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        AuthService.resend_verification_email(email)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"message": "If your email is registered and unverified, a new verification link has been sent."})


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    refresh_value = request.COOKIES.get(settings.SIMPLE_JWT.get("AUTH_COOKIE", "refresh_token"))
    if refresh_value:
        try:
            RefreshToken(refresh_value).blacklist()
        except Exception as exc:
            logger.warning("Logout refresh token blacklist failed: %s", exc)

    resp = Response({"detail": "Logged out"})
    _clear_refresh_cookie(resp)
    return resp


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_request_view(request):
    email = request.data.get("email")
    if not email:
        return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        AuthService.request_password_reset(email)
    except RuntimeError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"detail": "If the email exists, a reset link has been sent."})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_confirm_view(request):
    token = request.data.get("token")
    new_password = request.data.get("new_password")

    if not token or not new_password:
        return Response({"detail": "Token and new password are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        AuthService.confirm_password_reset(token, new_password)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"detail": "Password has been reset successfully."})


class AdminCookieTokenObtainPairView(CookieTokenObtainPairView):
    """Admin-only login endpoint."""

    def post(self, request, *args, **kwargs):
        email = (request.data.get("email") or request.data.get("username") or "").strip().lower()
        password = request.data.get("password")

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response(
                {"detail": "No active account found with the given credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        is_admin = bool(getattr(user, "is_staff", False) or getattr(user, "role", "") == User.ROLE_ADMIN)
        if not is_admin:
            return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

        return super().post(request, *args, **kwargs)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_session_view(request):
    user = request.user
    is_admin = bool(getattr(user, "is_staff", False) or getattr(user, "role", "") == User.ROLE_ADMIN)
    if not is_admin:
        return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    return Response(
        {
            "id": user.id,
            "email": user.email,
            "role": getattr(user, "role", User.ROLE_CUSTOMER),
            "is_staff": bool(getattr(user, "is_staff", False)),
        }
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def google_auth_view(request):
    """
    Optional Google OAuth login.

    NOTE: This project requires `phone_number`. For first-time Google signups,
    callers must send `phone_number` alongside `token`.
    """

    token = request.data.get("token")
    phone_number = request.data.get("phone_number")

    request._log_email = "google_oauth"

    if not token:
        return Response({"detail": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)

    google_client_id = getattr(settings, "GOOGLE_CLIENT_ID", None)
    if not google_client_id:
        return Response({"detail": "Google OAuth not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        response = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": token},
            timeout=10,
        )
        if response.status_code != 200:
            return Response({"detail": "Invalid Google token"}, status=status.HTTP_401_UNAUTHORIZED)

        token_info = response.json()
        if token_info.get("aud") != google_client_id:
            return Response({"detail": "Invalid Google token audience"}, status=status.HTTP_401_UNAUTHORIZED)

        google_email = token_info.get("email")
        google_name = token_info.get("name", "") or ""

        if not google_email:
            return Response({"detail": "Email not provided by Google"}, status=status.HTTP_400_BAD_REQUEST)

        first_name = google_name.split()[0] if google_name else ""
        last_name = " ".join(google_name.split()[1:]) if len(google_name.split()) > 1 else ""

        user = User.objects.filter(email=google_email).first()
        created = False
        if not user:
            if not phone_number:
                return Response(
                    {"detail": "phone_number is required for first-time Google signup", "requires_phone": True},
                    status=status.HTTP_409_CONFLICT,
                )
            phone_number = normalize_kenyan_phone(phone_number)
            if not re.match(r"^\\+2547\\d{8}$", phone_number):
                return Response(
                    {"detail": "Phone number must be in Kenyan format: +2547XXXXXXXX."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.create_user(
                email=google_email,
                phone_number=phone_number,
                password=None,
                first_name=first_name,
                last_name=last_name,
                full_name=google_name,
                is_active=True,
                is_email_verified=True,
            )
            created = True

        if created:
            log_auth_event("google_register", email=google_email)
        else:
            if not user.is_active:
                return Response({"detail": "Account is deactivated"}, status=status.HTTP_403_FORBIDDEN)
            log_auth_event("google_login", email=google_email)

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        resp = Response({"access": access, "user": UserSerializer(user).data})
        _set_refresh_cookie(resp, str(refresh))
        return resp

    except requests.RequestException as exc:
        logger.error("Google token verification failed: %s", exc)
        return Response({"detail": "Failed to verify Google token"}, status=status.HTTP_502_BAD_GATEWAY)
    except Exception as exc:
        logger.error("Google auth error: %s", exc)
        return Response({"detail": "Authentication failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

