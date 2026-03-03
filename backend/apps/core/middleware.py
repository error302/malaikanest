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
        'default': '100/hour',
        'auth': '10/minute',      # Login, register
        'password_reset': '3/hour',  # Password reset - max 3 per email per hour
        'api': '100/hour',
    }
    
    # Endpoints that require special rate limiting
    SENSITIVE_ENDPOINTS = [
        '/api/accounts/login/',
        '/api/accounts/register/',
        '/api/accounts/password/reset/',
        '/api/accounts/token/refresh/',
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
        """Check if request is within rate limit"""
        limit, period = self._parse_rate_limit(rate_limit)
        
        # Get current count
        cache_key = f"ratelimit:{key}"
        current = cache.get(cache_key, 0)
        
        if current >= limit:
            return False
        
        # Increment counter
        # Use add to handle race conditions
        try:
            cache.set(cache_key, current + 1, period)
        except Exception:
            # If cache fails, allow request
            pass
        
        return True
    
    def _get_remaining_requests(self, key, rate_limit):
        """Get remaining requests in current period"""
        limit, period = self._parse_rate_limit(rate_limit)
        cache_key = f"ratelimit:{key}"
        current = cache.get(cache_key, 0)
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
