from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.urls import reverse
from django.utils import timezone
from .serializers import UserSerializer, RegisterSerializer
from .models import User
import datetime


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
    except Exception:
        pass
    return Response({'detail': 'Logged out'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request_view(request):
    """Request a password reset by providing email"""
    email = request.data.get('email')
    
    if not email:
        return Response({'detail': 'Email is required'}, status=400)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'If an account exists with this email, a reset link has been sent'}, status=200)
    
    token = get_random_string(32)
    user.password_reset_token = token
    user.password_reset_expires = timezone.now() + datetime.timedelta(hours=24)
    user.save()
    
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}&email={email}"
    
    try:
        send_mail(
            subject='Reset Your Password - Malaika Nest',
            message=f'Click the link to reset your password: {reset_url}',
            html_message=f'''
                <h2>Password Reset - Malaika Nest</h2>
                <p>You requested a password reset for your Malaika Nest account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="{reset_url}" style="background-color: #BFA46F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
                <p>This link expires in 24 hours.</p>
                <p>If you didn't request this, please ignore this email.</p>
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger('apps.accounts')
        logger.error(f"Password reset email failed: {e}")
        return Response({'detail': 'Failed to send reset email. Please try again later or contact support.'}, status=500)
    
    return Response({'detail': 'If an account exists with this email, a reset link has been sent'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm_view(request):
    """Confirm password reset with token and new password"""
    token = request.data.get('token')
    email = request.data.get('email')
    new_password = request.data.get('new_password')
    
    if not all([token, email, new_password]):
        return Response({'detail': 'Token, email, and new password are required'}, status=400)
    
    try:
        user = User.objects.get(email=email, password_reset_token=token)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid or expired reset token'}, status=400)
    
    if not user.password_reset_expires or user.password_reset_expires < timezone.now():
        return Response({'detail': 'Reset token has expired'}, status=400)
    
    user.set_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.save()
    
    return Response({'detail': 'Password has been reset successfully'})


class CookieTokenObtainPairView(TokenObtainPairView):
    def finalize_response(self, request, response, *args, **kwargs):
        return super().finalize_response(request, response, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        resp = super().post(request, *args, **kwargs)
        try:
            refresh = resp.data.get('refresh')
            if refresh:
                max_age = int(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', 86400).total_seconds() if hasattr(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME'), 'total_seconds') else settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', 86400))
                expires = timezone.now() + datetime.timedelta(seconds=max_age)
                resp.set_cookie(
                    settings.SIMPLE_JWT.get('AUTH_COOKIE', 'refresh_token'),
                    refresh,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite='Lax',
                    expires=expires,
                )
                resp.data.pop('refresh', None)
        except Exception:
            pass
        return resp
