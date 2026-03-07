import logging
import time
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger("security")


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _threshold():
    return int(getattr(settings, "LOGIN_MAX_ATTEMPTS", 5))


def _window_seconds():
    return int(getattr(settings, "LOGIN_ATTEMPT_WINDOW_SECONDS", 900))


def _lockout_seconds():
    return int(getattr(settings, "LOGIN_LOCKOUT_SECONDS", 1800))


def _email_fail_key(email):
    return f"auth:fail:email:{email.lower()}"


def _ip_fail_key(ip):
    return f"auth:fail:ip:{ip}"


def _email_lock_key(email):
    return f"auth:lock:email:{email.lower()}"


def _ip_lock_key(ip):
    return f"auth:lock:ip:{ip}"


def _cache_get(key, default=None):
    try:
        return cache.get(key, default)
    except Exception:
        logger.error("Auth cache get failed for key=%s", key)
        return default


def _cache_set(key, value, ttl):
    try:
        cache.set(key, value, ttl)
    except Exception:
        logger.error("Auth cache set failed for key=%s", key)


def _cache_delete(key):
    try:
        cache.delete(key)
    except Exception:
        logger.error("Auth cache delete failed for key=%s", key)


def is_login_locked(email, ip):
    if not email:
        return False
    return bool(_cache_get(_email_lock_key(email)) or _cache_get(_ip_lock_key(ip)))


def register_login_failure(email, ip, user_agent="", reason=""):
    now = int(time.time())

    email_fails = _cache_get(_email_fail_key(email), 0) + 1
    ip_fails = _cache_get(_ip_fail_key(ip), 0) + 1

    _cache_set(_email_fail_key(email), email_fails, _window_seconds())
    _cache_set(_ip_fail_key(ip), ip_fails, _window_seconds())

    locked = False
    if email_fails >= _threshold():
        _cache_set(_email_lock_key(email), now, _lockout_seconds())
        locked = True
    if ip_fails >= (_threshold() * 2):
        _cache_set(_ip_lock_key(ip), now, _lockout_seconds())
        locked = True

    log_auth_event(
        event_type="login_failed",
        email=email,
        ip=ip,
        user_agent=user_agent,
        reason=reason,
        locked=locked,
        email_attempts=email_fails,
        ip_attempts=ip_fails,
    )


def clear_login_failures(email, ip):
    if email:
        _cache_delete(_email_fail_key(email))
        _cache_delete(_email_lock_key(email))
    if ip:
        _cache_delete(_ip_fail_key(ip))
        _cache_delete(_ip_lock_key(ip))


def log_auth_event(event_type, email="", ip="", user_agent="", **kwargs):
    payload = {
        "event": event_type,
        "email": (email or "").lower(),
        "ip": ip,
        "user_agent": (user_agent or "")[:300],
    }
    payload.update(kwargs)
    logger.warning("AUTH_EVENT %s", payload)