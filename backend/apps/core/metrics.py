"""Lightweight Redis-backed counters for RED metrics (rate/errors/duration).

Keeps observability dependency-free: counters live in the same Redis used for
caching/Celery. Pair with the JSON logging already configured for production to
get rate/error dashboards and the payments_failure_alert beat task.
"""
import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)


def incr(name, amount=1, *, timeout=86400 * 7):
    key = f"metric:{name}"
    try:
        # atomic increment; seed on first use
        cache.add(key, 0, timeout)
        cache.incr(key, amount)
    except Exception:
        try:
            cache.set(key, amount, timeout)
        except Exception:
            # `exc` was never bound here (bare `except Exception:`), so this
            # handler raised a second NameError and destroyed the original
            # diagnostic - and it fires precisely when the cache is down.
            logger.debug("metric incr fallback set failed for %s", name, exc_info=True)


def get(name):
    try:
        return cache.get(f"metric:{name}", 0) or 0
    except Exception:
        return 0


def reset(name):
    try:
        cache.delete(f"metric:{name}")
    except Exception:
        logger.debug("metric reset failed for %s", name)


#
# Prometheus exposition (Phase 5).
# Served at /metrics/ via apps.core.metrics_urls. In addition to the
# process/system metrics from prometheus_client, we expose the Redis-backed
# counters as gauges so existing RED metrics are scrapeable without changing
# the incr/get/reset API used across the codebase.
#
from prometheus_client import Gauge, generate_latest, CONTENT_TYPE_LATEST
from django.http import HttpResponse, HttpResponseForbidden

_redis_gauges = {}


def _redis_gauge(name):
    if name not in _redis_gauges:
        _redis_gauges[name] = Gauge(
            f"malaika_metric_{name.replace('-', '_').replace('.', '_')}",
            f"Redis-backed metric: {name}",
        )
    return _redis_gauges[name]


def metrics_view(request):
    """Prometheus exposition. Gated.

    This used to be world-readable, which leaked the exact Python patch level
    (so an attacker can look up CVEs instead of guessing), resident memory and
    fd limits (how close a 1 GB box is to OOM), process start time (an uptime /
    redeploy oracle) and live payments_success / payments_stk_initiated counters
    (i.e. your sales volume, free to anyone who polls it).

    Now: allowed from loopback without a token, otherwise requires
    `Authorization: Bearer $METRICS_TOKEN`. If no token is configured it fails
    closed off-box. Set EXPOSE_METRICS=false to unmount the URL entirely.
    """
    import os
    import secrets as _secrets

    token = (os.getenv("METRICS_TOKEN") or "").strip()
    client_ip = (
        request.META.get("HTTP_CF_CONNECTING_IP")
        or request.META.get("REMOTE_ADDR")
        or ""
    ).strip()
    is_loopback = client_ip in {"127.0.0.1", "::1", "localhost"}

    if not is_loopback:
        if not token:
            return HttpResponseForbidden("metrics disabled: METRICS_TOKEN not set")
        supplied = request.headers.get("Authorization", "")
        if supplied.lower().startswith("bearer "):
            supplied = supplied[7:].strip()
        if not supplied or not _secrets.compare_digest(supplied, token):
            return HttpResponseForbidden("invalid metrics token")

    # Whitelist of meaningful business metrics to export from Redis.
    for name in ("payments_failed", "payments_success", "payments_stk_initiated"):
        try:
            _redis_gauge(name).set(float(get(name)))
        except Exception:
            logger.debug("metrics_view gauge set failed for %s", name)
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
