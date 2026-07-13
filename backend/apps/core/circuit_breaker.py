"""Redis-backed circuit breaker (system-design-101: circuit breaker pattern).

Wraps outbound calls to M-Pesa so a slow/down Safaricom endpoint fails fast
instead of tying up web/Celery worker threads. State is shared via Redis so all
workers see the same open/closed state.
"""
import time

from django.core.cache import cache


class CircuitOpen(Exception):
    """Raised when the circuit breaker is open (upstream considered unavailable)."""


def call_with_breaker(
    name,
    func,
    *,
    failure_threshold=5,
    reset_timeout=30,
    failure_window=120,
):
    key = f"breaker:{name}"
    try:
        state = cache.get(key) or {"failures": 0, "open_until": 0.0, "window_start": 0.0}
    except Exception:
        state = {"failures": 0, "open_until": 0.0, "window_start": 0.0}

    now = time.time()
    # Reset the failure counter if the measuring window has elapsed.
    if state.get("window_start", 0.0) and now - state["window_start"] > failure_window:
        state["failures"] = 0
        state["window_start"] = now

    if state.get("open_until", 0.0) > now:
        raise CircuitOpen(f"Circuit breaker '{name}' is OPEN (upstream unavailable)")

    try:
        result = func()
    except Exception:
        state["failures"] = state.get("failures", 0) + 1
        state["window_start"] = state.get("window_start") or now
        if state["failures"] >= failure_threshold:
            state["open_until"] = now + reset_timeout
        try:
            cache.set(key, state, timeout=reset_timeout * 2 + 60)
        except Exception:
            pass
        raise
    else:
        if state.get("failures", 0):
            state["failures"] = 0
            state["open_until"] = 0.0
            state["window_start"] = now
            try:
                cache.set(key, state, timeout=reset_timeout * 2 + 60)
            except Exception:
                pass
        return result
