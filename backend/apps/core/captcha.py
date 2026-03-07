import os
import requests
from django.conf import settings


class CaptchaError(Exception):
    pass


def _captcha_enabled(enforce: bool) -> bool:
    secret = getattr(settings, "CAPTCHA_SECRET_KEY", "")
    return bool(enforce and secret)


def _verify_url() -> str:
    provider = getattr(settings, "CAPTCHA_PROVIDER", "turnstile")
    override = getattr(settings, "CAPTCHA_VERIFY_URL", "")
    if override:
        return override
    if provider == "recaptcha":
        return "https://www.google.com/recaptcha/api/siteverify"
    return "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def require_captcha(request, action: str, enforce: bool = True):
    if not _captcha_enabled(enforce):
        return

    token = request.data.get("captcha_token") or request.headers.get("X-Captcha-Token")
    if not token:
        raise CaptchaError("CAPTCHA is required")

    payload = {
        "secret": getattr(settings, "CAPTCHA_SECRET_KEY"),
        "response": token,
        "remoteip": request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", "")),
    }

    try:
        response = requests.post(_verify_url(), data=payload, timeout=int(getattr(settings, "CAPTCHA_TIMEOUT_SECONDS", 8)))
        data = response.json()
    except Exception:
        raise CaptchaError("CAPTCHA verification service unavailable")

    if not data.get("success", False):
        raise CaptchaError("CAPTCHA verification failed")

    # Turnstile may return action; verify when present.
    returned_action = data.get("action")
    if returned_action and returned_action != action:
        raise CaptchaError("CAPTCHA action mismatch")