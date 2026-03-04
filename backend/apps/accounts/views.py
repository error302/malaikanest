from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.urls import reverse
from django.utils import timezone
from django.utils.html import strip_tags
from django.template.loader import render_to_string
from .serializers import UserSerializer, RegisterSerializer
from .models import User
import datetime
import hashlib


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create user but set as inactive pending email verification
        user = serializer.save(is_active=False)

        # Generate email verification token
        token = get_random_string(64)
        user.verification_token = token
        user.save()

        # Send verification email
        self._send_verification_email(user, token)

        return Response(
            {
                "message": "Registration successful. Please check your email to verify your account.",
                "user_id": user.id,
            },
            status=status.HTTP_201_CREATED,
        )

    def _send_verification_email(self, user, token):
        """Send email verification link"""
        try:
            verify_url = f"{settings.FRONTEND_URL or 'http://104.154.161.10'}/verify-email?token={token}"

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
                from_email=settings.DEFAULT_FROM_EMAIL
                if hasattr(settings, "DEFAULT_FROM_EMAIL")
                else "noreply@malaikanest.com",
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Log error but don't fail registration
            import logging

            logger = logging.getLogger("apps.accounts")
            logger.error(f"Failed to send verification email: {e}")
            # Auto-activate for now if email fails
            user.is_active = True
            user.verification_token = None
            user.save()


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

        user.is_active = True
        user.verification_token = None
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
    """Resend verification email"""
    email = request.data.get("email")

    if not email:
        return Response(
            {"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)

        if user.is_active:
            return Response(
                {"detail": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Generate new token
        token = get_random_string(64)
        user.verification_token = token
        user.save()

        # Send verification email
        from .views import RegisterView

        rv = RegisterView()
        rv._send_verification_email(user, token)

        return Response({"message": "Verification email sent"})
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)


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
    except Exception:
        pass
    return Response({"detail": "Logged out"})


def _is_email_configured():
    """Check if SMTP is properly configured"""
    return all(
        [
            settings.EMAIL_HOST,
            settings.EMAIL_HOST_USER,
            settings.EMAIL_HOST_PASSWORD,
            settings.DEFAULT_FROM_EMAIL,
        ]
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_request_view(request):
    """Request a password reset by providing email"""
    # Check if email is configured
    if not _is_email_configured():
        import logging

        logger = logging.getLogger("apps.accounts")
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
        # Don't reveal if user exists
        return Response({"detail": "If the email exists, a reset link has been sent."})

    # Generate reset token
    token = get_random_string(64)
    user.password_reset_token = token
    user.password_reset_expires = timezone.now() + timezone.timedelta(hours=24)
    user.save()

    # Build reset URL
    reset_url = f"{getattr(settings, 'FRONTEND_URL', 'http://104.154.161.10')}/reset-password?token={token}"

    try:
        send_mail(
            subject="Reset Your Password - Malaika Nest",
            message=f"Click here to reset your password: {reset_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        import logging

        logger = logging.getLogger("apps.accounts")
        logger.error(f"Failed to send password reset email: {e}")
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

    if user.password_reset_expires < timezone.now():
        return Response(
            {"detail": "Token has expired"}, status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.save()

    return Response({"detail": "Password has been reset successfully."})
