from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.html import strip_tags
from .serializers import UserSerializer, RegisterSerializer
from .models import User
import logging
import hashlib

logger = logging.getLogger("apps.accounts")


class ResendVerificationThrottle(AnonRateThrottle):
    # MED-08: Rate limit resend verification to 3 per hour per IP
    rate = "3/hour"
    scope = "resend_verification"


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create user but set as inactive pending email verification
        user = serializer.save(is_active=False)

        # Generate email verification token with expiry
        token = get_random_string(64)
        user.verification_token = token
        # MED-04: Token expires in 24 hours
        user.verification_token_expires = timezone.now() + timezone.timedelta(hours=24)
        user.save()

        # Send verification email
        email_sent = self._send_verification_email(user, token)

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
        """Send email verification link"""
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
    """Verify email with token"""
    token = request.data.get("token")

    if not token:
        return Response(
            {"detail": "Token is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(verification_token=token)

        if user.is_active:
            return Response(
                {"detail": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST
            )

        # MED-04: Check token expiry
        if user.verification_token_expires and user.verification_token_expires < timezone.now():
            return Response(
                {"detail": "Verification link has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = True
        user.email_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        user.save()

        return Response(
            {
                "message": "Email verified successfully! You can now login.",
                "success": True,
            }
        )
    except User.DoesNotExist:
        return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def resend_verification_view(request):
    """
    Resend verification email.
    MED-08: Rate limited to 3/hour per IP.
    HIGH-02: Fixed user enumeration — always returns same message whether user exists or not.
    """
    throttle_classes = [ResendVerificationThrottle]

    email = request.data.get("email")

    if not email:
        return Response(
            {"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    # HIGH-02: Always return same response regardless of whether email exists
    # This prevents user enumeration attacks
    try:
        user = User.objects.get(email=email)
        if not user.is_active:
            # Generate new token with expiry
            token = get_random_string(64)
            user.verification_token = token
            # MED-04: Token expires in 24 hours
            user.verification_token_expires = timezone.now() + timezone.timedelta(hours=24)
            user.save()

            rv = RegisterView()
            rv._send_verification_email(user, token)
    except User.DoesNotExist:
        # Don't reveal that user doesn't exist — just return the same message
        pass

    return Response({
        "message": "If your email is registered and unverified, a new verification link has been sent."
    })


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        token = RefreshToken(request.data.get("refresh"))
        token.blacklist()
    except Exception as e:
        logger.warning("Logout token blacklist failed: %s", e)
    return Response({"detail": "Logged out"})


def _is_email_configured():
    """Check if SMTP is properly configured"""
    return all(
        [
            getattr(settings, "EMAIL_HOST", None),
            getattr(settings, "EMAIL_HOST_USER", None),
            getattr(settings, "EMAIL_HOST_PASSWORD", None),
            getattr(settings, "DEFAULT_FROM_EMAIL", None),
        ]
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_request_view(request):
    """Request a password reset by providing email"""
    if not _is_email_configured():
        logger.error(
            "Email not configured. Missing EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, or DEFAULT_FROM_EMAIL"
        )
        return Response(
            {"detail": "Password reset is not configured. Please contact support."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    email = request.data.get("email")
    if not email:
        return Response(
            {"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if user exists — return same message either way
        return Response({"detail": "If the email exists, a reset link has been sent."})

    # Generate reset token
    token = get_random_string(64)
    user.password_reset_token = token
    user.password_reset_expires = timezone.now() + timezone.timedelta(hours=24)
    user.save()

    # Build reset URL
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
        return Response(
            {"detail": "Failed to send reset email. Please try again later."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response({"detail": "If the email exists, a reset link has been sent."})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_confirm_view(request):
    """Confirm password reset with token and new password"""
    token = request.data.get("token")
    new_password = request.data.get("new_password")

    if not token or not new_password:
        return Response(
            {"detail": "Token and new password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(password_reset_token=token)
    except User.DoesNotExist:
        return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

    if not user.password_reset_expires or user.password_reset_expires < timezone.now():
        return Response(
            {"detail": "Token has expired"}, status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.save()

    return Response({"detail": "Password has been reset successfully."})
