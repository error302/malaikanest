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
            logger.debug("metric incr fallback set failed for %s: %s", name, exc)


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
from django.http import HttpResponse

_redis_gauges = {}


def _redis_gauge(name):
    if name not in _redis_gauges:
        _redis_gauges[name] = Gauge(
            f"malaika_metric_{name.replace('-', '_').replace('.', '_')}",
            f"Redis-backed metric: {name}",
        )
    return _redis_gauges[name]


def metrics_view(request):
    """Scrape endpoint for Prometheus. Refreshes Redis-backed gauges, then
    returns the full exposition (incl. python process + system metrics)."""
    # Whitelist of meaningful business metrics to export from Redis.
    for name in ("payments_failed", "payments_success", "payments_stk_initiated"):
        try:
            _redis_gauge(name).set(float(get(name)))
        except Exception:
            logger.debug("metrics_view gauge set failed for %s", name)
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
