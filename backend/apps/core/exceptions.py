"""
Custom Exception Handler
Provides consistent error responses and security-focused error messages
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

logger = logging.getLogger('security')


def custom_exception_handler(exc, context):
    """
    Custom exception handler that:
    - Provides consistent error format
    - Logs security-related errors
    - Hides sensitive information in production
    """
    # Call REST framework's default exception handler
    response = exception_handler(exc, context)
    
    # Get request from context
    request = context.get('request')
    
    if response is not None:
        sanitized = _sanitize_error_message(response.data)
        error_payload = {
            "status_code": response.status_code,
            "detail": sanitized,
        }
        
        # Add debug information in development
        if getattr(settings, 'DEBUG', False):
            error_payload["debug"] = {
                'exception': str(exc),
                'path': request.path if request else 'unknown',
            }
        
        response.data = {
            "success": False,
            "message": "",
            "data": None,
            "error": error_payload,
        }
        
        # Log security-related errors
        if response.status_code >= 500:
            logger.error(
                f"Server error: {exc} | Path: {request.path if request else 'unknown'}",
                exc_info=True
            )
        elif response.status_code == 403:
            logger.warning(
                f"Permission denied: {request.user} | Path: {request.path}" if request else "Permission denied"
            )
        elif response.status_code == 401:
            logger.warning(
                f"Authentication failed: {request.META.get('REMOTE_ADDR')} | Path: {request.path}" if request else "Auth failed"
            )
    
    else:
        # Handle exceptions not caught by DRF
        error_payload = {
            "status_code": 500,
            "detail": "An internal error occurred. Please try again later.",
        }
        
        # Log the error
        logger.error(
            f"Unhandled exception: {exc} | Path: {request.path if request else 'unknown'}",
            exc_info=True
        )
        
        response = Response(
            {
                "success": False,
                "message": "",
                "data": None,
                "error": error_payload,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    
    return response


def _sanitize_error_message(error_data):
    """
    Sanitize error messages to prevent information leakage
    """
    if isinstance(error_data, str):
        # Don't expose detailed validation errors in production
        if not getattr(settings, 'DEBUG', False):
            if 'password' in error_data.lower():
                return 'Invalid credentials'
            return 'An error occurred'
        return error_data
    
    if isinstance(error_data, dict):
        sanitized = {}
        for key, value in error_data.items():
            # Sanitize sensitive field names
            if any(sensitive in key.lower() for sensitive in ['password', 'token', 'secret', 'key']):
                sanitized[key] = '***REDACTED***'
            else:
                sanitized[key] = _sanitize_error_message(value)
        return sanitized
    
    if isinstance(error_data, list):
        return [_sanitize_error_message(item) for item in error_data]
    
    return error_data



class SecurityError(Exception):
    """Base exception for security-related errors"""
    pass


class InvalidRedirectError(SecurityError):
    """Raised when a redirect URL is not in the allowlist"""
    pass


class RateLimitExceededError(SecurityError):
    """Raised when rate limit is exceeded"""
    pass


class TokenRevokedError(SecurityError):
    """Raised when a token has been revoked"""
    pass
