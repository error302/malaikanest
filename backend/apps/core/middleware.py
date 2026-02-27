import time
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('apps.core')


class SecurityHeadersMiddleware:
    """Simple middleware to add security-related headers (CSP, Referrer-Policy, Permissions-Policy)."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Basic Content Security Policy — allow self, https, data for images
        csp = "default-src 'self' https:; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https: wss:; frame-ancestors 'none';"
        response.setdefault('Content-Security-Policy', csp)
        response.setdefault('X-Content-Type-Options', 'nosniff')
        response.setdefault('Referrer-Policy', 'no-referrer-when-downgrade')
        response.setdefault('Permissions-Policy', "geolocation=(), microphone=(), camera=()")
        response.setdefault('X-Frame-Options', 'DENY')
        response.setdefault('X-XSS-Protection', '1; mode=block')

        return response


class RequestLoggingMiddleware:
    """Middleware to log API request/response times."""
    
    EXCLUDED_PATHS = [
        '/api/health/',
        '/api/ready/',
        '/admin/jsi18n/',
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        request.start_time = time.time()
        response = self.get_response(request)
        
        # Skip logging for health checks and static files
        if any(request.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return response
        
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Log slow requests (> 1 second)
            if duration > 1.0:
                logger.warning(
                    f"Slow request: {request.method} {request.path} "
                    f"took {duration:.2f}s - Status: {response.status_code}"
                )
            else:
                logger.info(
                    f"{request.method} {request.path} "
                    f"completed in {duration:.3f}s - Status: {response.status_code}"
                )
        
        return response
    
    def process_exception(self, request, exception):
        logger.exception(
            f"Exception during request: {request.method} {request.path} - "
            f"Error: {str(exception)}"
        )
        return None
