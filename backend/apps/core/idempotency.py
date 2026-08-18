"""
Idempotency middleware & utilities.

Guarantees that a client can safely retry the same request (identified by an
Idempotency-Key header) without causing duplicate side effects (e.g. duplicate
STK pushes, duplicate orders).

Storage uses a dedicated Redis namespace with automatic TTL so the main
PostgreSQL connection pool is not consumed by idempotency lookups.
"""
import hashlib
import json
import logging
from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone

logger = logging.getLogger("apps.core")

IDEMPOTENCY_TTL = 60 * 60  # 1 hour — keys expire after this


def _make_idempotency_key(request) -> str:
    """
    Deterministic key from method + path + Idempotency-Key header.
    """
    import hashlib
    raw = f"{request.method}:{request.path}:{request.headers.get('Idempotency-Key', '')}"
    return f"idempotency:{hashlib.sha256(raw.encode()).hexdigest()}"


class IdempotencyMiddleware:
    """
    Middleware that enforces idempotency for POST/PUT/PATCH/DELETE requests
    that carry an Idempotency-Key header.

    - First request: stores the response status + body in Redis.
    - Retry: returns the stored response without hitting the view.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method not in ("POST", "PUT", "PATCH", "DELETE"):
            return self.get_response(request)

        idem_key = request.headers.get("Idempotency-Key")
        if not idem_key:
            return self.get_response(request)

        if len(idem_key) > 128:
            return JsonResponse({"detail": "Idempotency-Key must be ≤ 128 characters."}, status=400)

        cache_key = _make_idempotency_key(request)
        from django.core.cache import cache

        try:
            existing = cache.get(cache_key)
        except Exception:
            existing = None

        if existing is not None:
            return JsonResponse(existing["body"], status=existing["status"])

        response = self.get_response(request)

        if 200 <= response.status_code < 500:
            try:
                body = json.loads(response.content) if response.content else {}
            except (json.JSONDecodeError, TypeError, AttributeError):
                body = {"detail": "ok"}

            try:
                cache.set(cache_key, {"status": response.status_code, "body": body}, IDEMPOTENCY_TTL)
            except Exception:
                logger.debug("Idempotency cache set failed for key=%s", cache_key[:32])

        return response


class IdempotencyKey:
    """
    Simple value object for an idempotency key.
    """

    def __init__(self, key: str):
        if not key or not isinstance(key, str):
            raise ValueError("Idempotency-Key must be a non-empty string")
        if len(key) > 128:
            raise ValueError("Idempotency-Key must be ≤ 128 characters")
        self.key = key

    def __str__(self):
        return self.key

    def __eq__(self, other):
        if isinstance(other, IdempotencyKey):
            return self.key == other.key
        return NotImplemented

    def __hash__(self):
        return hash(self.key)
