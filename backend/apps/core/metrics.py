"""Lightweight Redis-backed counters for RED metrics (rate/errors/duration).

Keeps observability dependency-free: counters live in the same Redis used for
caching/Celery. Pair with the JSON logging already configured for production to
get rate/error dashboards and the payments_failure_alert beat task.
"""
from django.core.cache import cache


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
            pass


def get(name):
    try:
        return cache.get(f"metric:{name}", 0) or 0
    except Exception:
        return 0


def reset(name):
    try:
        cache.delete(f"metric:{name}")
    except Exception:
        pass
