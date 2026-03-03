"""
Redirect URL Validator
Validates redirect URLs against an allowlist to prevent open redirect attacks
"""
import logging
from urllib.parse import urlparse
from django.conf import settings

logger = logging.getLogger('security')


def validate_redirect_url(url, allowlist=None):
    """
    Validate a redirect URL against an allowlist to prevent open redirect attacks.
    
    Args:
        url: The URL to validate
        allowlist: Optional list of allowed domains. If None, uses VALID_REDIRECT_HOSTS from settings.
    
    Returns:
        bool: True if the URL is safe to redirect to
    
    Raises:
        ValueError: If the URL is not safe to redirect to
    """
    if not url:
        return True
    
    # Don't allow redirect to absolute URLs unless they're in our allowlist
    parsed = urlparse(url)
    
    # If it's a relative URL, it's safe (same origin)
    if not parsed.netloc:
        # Relative URL - safe
        return True
    
    # It's an absolute URL - check against allowlist
    allowed_hosts = allowlist or getattr(settings, 'VALID_REDIRECT_HOSTS', [])
    
    if not allowed_hosts:
        # No allowlist configured - only allow same origin
        allowed_hosts = settings.ALLOWED_HOSTS
    
    # Normalize the host
    host = parsed.netloc.lower()
    
    # Remove port if present
    if ':' in host:
        host = host.split(':')[0]
    
    # Check if host is in allowlist
    for allowed in allowed_hosts:
        allowed = allowed.lower().strip()
        if allowed == host or host.endswith('.' + allowed):
            return True
    
    # Log suspicious redirect attempt
    logger.warning(
        f"Blocked potential open redirect: {url} | Allowed: {allowed_hosts}"
    )
    
    return False


def get_safe_redirect_url(url, default='/'):
    """
    Get a safe redirect URL, returning default if the provided URL is not safe.
    
    Args:
        url: The requested redirect URL
        default: The default URL to return if the provided URL is not safe
    
    Returns:
        str: A safe redirect URL
    """
    if validate_redirect_url(url):
        return url
    return default


def validate_origin(origin, allowlist=None):
    """
    Validate an Origin header against an allowlist for CORS.
    
    Args:
        origin: The Origin header value
        allowlist: Optional list of allowed origins
    
    Returns:
        bool: True if the origin is allowed
    """
    if not origin:
        return False
    
    allowed_origins = allowlist or getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
    
    # Normalize origin
    origin = origin.lower().strip()
    
    # Remove trailing slash
    if origin.endswith('/'):
        origin = origin[:-1]
    
    for allowed in allowed_origins:
        allowed = allowed.lower().strip()
        if allowed.endswith('/'):
            allowed = allowed[:-1]
        
        if allowed == origin or origin.endswith('.' + allowed):
            return True
    
    logger.warning(f"Blocked CORS request from origin: {origin}")
    return False
