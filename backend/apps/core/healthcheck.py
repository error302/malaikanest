from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
import os
import logging

logger = logging.getLogger("apps.core")

try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


def health_check(request):
    """
    Health check endpoint for monitoring.
    Returns 200 if all systems are healthy, 503 otherwise.
    """
    status = {"status": "ok", "timestamp": timezone.now().isoformat(), "checks": {}}
    http_status = 200

    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        status["checks"]["database"] = "ok"
    except Exception as e:
        logger.error(f"Health check - Database error: {e}")
        status["checks"]["database"] = "error"
        status["status"] = "error"
        http_status = 503

    # Check Redis (optional - not required for health)
    if REDIS_AVAILABLE:
        try:
            redis_url = getattr(settings, "CELERY_BROKER_URL", None)
            if redis_url:
                r = redis.from_url(redis_url)
                r.ping()
                status["checks"]["redis"] = "ok"
            else:
                status["checks"]["redis"] = "not_configured"
        except Exception as e:
            logger.warning(f"Health check - Redis error: {e}")
            status["checks"]["redis"] = "degraded"
    else:
        status["checks"]["redis"] = "not_available"

    # Check cache
    try:
        cache.set("health_check", "ok", 10)
        if cache.get("health_check") == "ok":
            status["checks"]["cache"] = "ok"
    except Exception as e:
        logger.warning(f"Health check - Cache error: {e}")
        status["checks"]["cache"] = "degraded"

    return JsonResponse(status, status=http_status)


def readiness_check(request):
    """
    Kubernetes readiness probe - checks if app can serve traffic.
    """
    return health_check(request)
