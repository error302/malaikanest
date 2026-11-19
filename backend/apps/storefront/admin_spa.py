"""Static TypeScript admin dashboard, served by Django, auth-gated by staff status.

The SPA is a Vite build committed to backend/static/adminapp/. It talks to the
existing cookie-JWT admin endpoints (/api/accounts/admin/*, /api/orders/admin/*,
/api/products/admin/*), so no new API surface is introduced here.

Auth gate accepts either a Django session (classic admin) or the same JWT
access-token cookie the SPA uses against the API, so the shell is only ever
served to an authenticated staff member.
"""

import logging

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie
from urllib.parse import urlencode
from django.views.generic import View

from apps.accounts.authentication import CookieJWTAuthentication

logger = logging.getLogger(__name__)

_SPA_ROOT = settings.BASE_DIR / "static" / "adminapp"


def _spa_asset(name: str) -> str | None:
    path = _SPA_ROOT / name
    if path.is_file():
        try:
            return path.read_text(encoding="utf-8")
        except OSError:
            return None
    return None


def _staff_user(request):
    """Return the staff user for this request via session or JWT cookie, else None."""
    user = getattr(request, "user", None)
    if user is not None and user.is_authenticated and user.is_staff:
        return user
    try:
        result = CookieJWTAuthentication().authenticate(request)
    except Exception as exc:
        logger.debug("SPA admin gate: JWT authentication failed: %s", exc)
        return None
    if result is None:
        return None
    jwt_user, _token = result
    if jwt_user.is_active and jwt_user.is_staff:
        return jwt_user
    return None


@method_decorator(never_cache, name="dispatch")
@method_decorator(ensure_csrf_cookie, name="dispatch")
class AdminDashboardView(View):
    """Serve the SPA shell at /manage/dashboard/ (staff only)."""

    def get(self, request):
        if _staff_user(request) is None:
            prefix = (getattr(settings, "ADMIN_URL_PREFIX", None) or "manage-store").strip("/")
            return redirect(f"/{prefix}/login/?" + urlencode({"next": request.path}))
        html = _spa_asset("index.html")
        if html is None:
            return HttpResponse(
                "<h1>Store manager temporarily unavailable</h1><p>Please try again later.</p>",
                status=503,
                content_type="text/html",
            )
        return HttpResponse(html, content_type="text/html")
