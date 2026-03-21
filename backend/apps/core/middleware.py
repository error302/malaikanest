"""
Custom Rate Limiting Middleware
Provides IP-based and endpoint-specific rate limiting
"""
import logging
import time
from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger('security')


class RateLimitMiddleware:
    """
    Custom rate limiting middleware that provides:
    - Global rate limiting by IP
    - Endpoint-specific rate limiting
    - Special protection for sensitive endpoints (password reset, login)
    """
    
    # Rate limits for different endpoint categories
    RATE_LIMITS = {
        'default': '500/hour',
        'auth': '20/minute',      # Login, register
        'password_reset': '5/hour',  # Password reset - max 5 per email per hour
        'api': '500/hour',
    }
    
    # Endpoints excluded from rate limiting
    EXCLUDED_ENDPOINTS = [
        '/api/accounts/profile/',
        '/api/v1/accounts/profile/',
        '/api/accounts/token/refresh/',
        '/api/v1/accounts/token/refresh/',
        '/api/products/banners/',
        '/api/v1/products/banners/',
        '/api/products/categories/',
        '/api/v1/products/categories/',
        '/api/products/products/',
        '/api/v1/products/products/',
    ]
    
    # Endpoints that require special rate limiting
    SENSITIVE_ENDPOINTS = [
        '/api/accounts/token/',
        '/api/v1/accounts/token/',
        '/api/accounts/admin/login/',
        '/api/v1/accounts/admin/login/',
        '/api/accounts/register/',
        '/api/v1/accounts/register/',
        '/api/accounts/resend-verification/',
        '/api/v1/accounts/resend-verification/',
        '/api/accounts/password/reset/',
        '/api/v1/accounts/password/reset/',
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip rate limiting for admin paths (handled by Django admin)
        if request.path.startswith('/admin/'):
            return self.get_response(request)
        
        # Skip rate limiting for health checks
        if request.path in ['/health/', '/api/health/']:
            return self.get_response(request)
        
        # Determine rate limit key and limit
        rate_key, rate_limit = self._get_rate_limit_info(request)
        
        if not self._check_rate_limit(rate_key, rate_limit):
            logger.warning(
                f"Rate limit exceeded for {rate_key} on {request.path}"
            )
            return JsonResponse(
                {
                    'detail': 'Rate limit exceeded. Please try again later.',
                    'retry_after': self._get_retry_after(rate_key)
                },
                status=429
            )
        
        response = self.get_response(request)
        
        # Add rate limit headers
        remaining = self._get_remaining_requests(rate_key, rate_limit)
        response['X-RateLimit-Limit'] = str(self._parse_rate_limit(rate_limit))
        response['X-RateLimit-Remaining'] = str(remaining)
        
        return response
    
    def _get_rate_limit_info(self, request):
        """Determine the rate limit key and limit for this request"""
        ip = self._get_client_ip(request)
        
        # Check if this is a sensitive endpoint
        if any(request.path.startswith(endpoint) for endpoint in self.SENSITIVE_ENDPOINTS):
            if 'password' in request.path:
                # Special rate limit for password reset - combine IP and email
                email = request.data.get('email', '') if hasattr(request, 'data') else ''
                return f"password_reset:{ip}:{email}", self.RATE_LIMITS['password_reset']
            return f"auth:{ip}", self.RATE_LIMITS['auth']
        
        # Default rate limiting
        return f"api:{ip}", self.RATE_LIMITS['api']
    
    def _get_client_ip(self, request):
        """Get client IP, considering proxies"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')
    
    def _check_rate_limit(self, key, rate_limit):
        """
        Check if request is within rate limit.
        HIGH-03: Fixed — using atomic cache.add() + cache.incr() instead of
        non-atomic cache.get() + cache.set(), which had a race condition allowing
        concurrent requests to bypass the rate limit entirely.
        """
        limit, period = self._parse_rate_limit(rate_limit)
        cache_key = f"ratelimit:{key}"

        try:
            # Atomically initialize the key if it doesn't exist
            cache.add(cache_key, 0, period)
            # Atomically increment — returns new value
            current = cache.incr(cache_key)
        except Exception:
            # If cache (Redis) is unavailable, allow request but log
            logger.error("Rate limit cache unavailable — allowing request for %s", key)
            return True

        return current <= limit
    
    def _get_remaining_requests(self, key, rate_limit):
        """Get remaining requests in current period"""
        limit, period = self._parse_rate_limit(rate_limit)
        cache_key = f"ratelimit:{key}"
        try:
            current = cache.get(cache_key, 0)
        except Exception:
            logger.error("Rate limit cache unavailable while reading remaining for %s", key)
            return 0
        return max(0, limit - current)
    
    def _get_retry_after(self, key):
        """Get seconds until rate limit resets"""
        # This is an approximation
        return 3600  # 1 hour
    
    def _parse_rate_limit(self, rate_limit):
        """Parse rate limit string (e.g., '100/hour') into (count, seconds)"""
        parts = rate_limit.split('/')
        count = int(parts[0])
        period = parts[1] if len(parts) > 1 else 'hour'
        
        seconds = {
            'second': 1,
            'minute': 60,
            'hour': 3600,
            'day': 86400,
        }.get(period, 3600)
        
        return count, seconds


class SecurityHeadersMiddleware:
    """Add security headers to all responses"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Only add headers to API responses
        if request.path.startswith('/api/'):
            response['X-Content-Type-Options'] = 'nosniff'
            response['X-Frame-Options'] = 'DENY'
            response['X-XSS-Protection'] = '1; mode=block'
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response


class RequestValidationMiddleware:
    """
    Validate incoming requests for common attack patterns
    """
    
    # Suspicious patterns that might indicate an attack
    SUSPICIOUS_PATTERNS = [
        b'<script',
        b'javascript:',
        b'onerror=',
        b'onload=',
        b'eval(',
        b'exec(',
        b'union select',
        b'drop table',
        b'drop index',
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Only validate POST/PUT/PATCH requests
        if request.method in ['POST', 'PUT', 'PATCH']:
            # Check content type
            content_type = request.META.get('CONTENT_TYPE', '')
            
            # Only validate JSON content
            if 'application/json' in content_type:
                body = request.body
                
                # Check for suspicious patterns in request body
                if body:
                    body_lower = body.lower()
                    for pattern in self.SUSPICIOUS_PATTERNS:
                        if pattern in body_lower:
                            logger.warning(
                                f"Suspicious pattern detected: {pattern} from {request.META.get('REMOTE_ADDR')}"
                            )
                            # Don't block - just log
                            # Could be legitimate content
        
        return self.get_response(request)


import uuid

request_logger = logging.getLogger('apps')


class RequestLoggingMiddleware:
    """
    Structured request/response logging middleware.
    Logs every request with: timestamp, request_id, method, path, status_code,
    duration_ms, and user identity.
    Also injects X-Request-ID header for client-side traceability.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = str(uuid.uuid4())
        start_time = time.monotonic()

        # Attach request_id to the request object so views can reference it
        request.request_id = request_id

        response = self.get_response(request)

        duration_ms = round((time.monotonic() - start_time) * 1000)

        user = 'anonymous'
        if hasattr(request, 'user') and request.user and request.user.is_authenticated:
            user = str(request.user.pk)

        log_level = logging.WARNING if response.status_code >= 400 else logging.INFO

        _email_mask = getattr(request, '_log_email', None)
        if _email_mask:
            _email_mask = _email_mask[:2] + '***'

        request_logger.log(
            log_level,
            'request '
            'request_id=%s method=%s path=%s status=%s duration_ms=%s user=%s ip=%s',
            request_id,
            request.method,
            request.path,
            response.status_code,
            duration_ms,
            _email_mask or user,
            request.META.get('REMOTE_ADDR', 'unknown')[:3] + '***',
        )

        response['X-Request-ID'] = request_id
        return response
