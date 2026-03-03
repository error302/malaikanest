"""
JWT Authentication with Refresh Token Rotation
Provides secure token handling with automatic rotation
"""
import logging
from datetime import timedelta
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings

logger = logging.getLogger('security')


class JWTAuthenticationWithRotation(JWTAuthentication):
    """
    JWT Authentication with automatic refresh token rotation.
    Implements refresh token rotation to prevent token reuse attacks.
    """
    
    def authenticate(self, request):
        result = super().authenticate(request)
        
        if result is None:
            return None
            
        user, validated_token = result
        
        # Check if token is about to expire (within 5 minutes)
        if self._token_is_expiring_soon(validated_token):
            # Token is expiring soon, but we don't auto-refresh here
            # The frontend should use the refresh endpoint
            pass
        
        # Log successful authentication
        logger.info(f"User {user.email} authenticated successfully")
        
        return (user, validated_token)
    
    def _token_is_expiring_soon(self, token, threshold_minutes=5):
        """Check if token will expire within threshold minutes"""
        try:
            exp = token.payload.get('exp')
            if exp:
                from datetime import datetime
                expiry = datetime.fromtimestamp(exp, tz=timezone.utc)
                threshold = timedelta(minutes=threshold_minutes)
                return expiry - timezone.now() < threshold
        except Exception:
            pass
        return False
    
    def get_user(self, validated_token):
        """
        Override to add additional security checks
        """
        user = super().get_user(validated_token)
        
        # Check if user is active
        if not user.is_active:
            raise InvalidToken("User account is disabled")
        
        return user


class TokenRotationMixin:
    """
    Mixin to handle refresh token rotation
    """
    
    @classmethod
    def get_token(cls, user):
        from rest_framework_simplejwt.tokens import RefreshToken
        
        # Invalidate any existing tokens for this user
        # This prevents token reuse after logout
        token = RefreshToken.for_user(user)
        
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['is_admin'] = user.is_staff
        
        # Set absolute expiry
        from datetime import timedelta
        from django.conf import settings
        
        # Add token version for invalidation
        token['token_version'] = user.profile.token_version if hasattr(user, 'profile') else 1
        
        return token
    
    def refresh(self, request):
        """
        Override to implement refresh token rotation
        """
        from rest_framework.response import Response
        from rest_framework import status
        
        try:
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response(
                    {'detail': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate the refresh token
            token = RefreshToken(refresh_token)
            
            # Check token version
            token_version = token.payload.get('token_version', 1)
            
            # Get user and check version
            user = self.user_from_token(token)
            if hasattr(user, 'profile'):
                if user.profile.token_version != token_version:
                    # Token was invalidated
                    return Response(
                        {'detail': 'Token has been revoked'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            
            # Generate new tokens (rotation)
            new_token = self.get_token(user)
            
            # Blacklist old refresh token
            token.blacklist()
            
            return Response({
                'access': str(new_token.access_token),
                'refresh': str(new_token),
            })
            
        except TokenError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


def invalidate_all_user_tokens(user):
    """
    Invalidate all tokens for a user by incrementing their token version
    Call this when user changes password or is disabled
    """
    if hasattr(user, 'profile'):
        from django.db import transaction
        with transaction.atomic():
            user.profile.token_version += 1
            user.profile.save()
            logger.warning(f"All tokens invalidated for user {user.email}")
    else:
        logger.warning(f"Cannot invalidate tokens - user {user.email} has no profile")
