"""Public PWA resources. Never cache personalized pages or transactions."""
from pathlib import Path
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def manifest(request):
    return JsonResponse({
        "id": "/", "name": "Malaika Nest", "short_name": "Malaika Nest",
        "start_url": "/", "scope": "/", "display": "standalone",
        "background_color": "#ffffff", "theme_color": "#12324a",
        "icons": [{"src": f"/static/img/pwa-{size}.png", "sizes": f"{size}x{size}", "type": "image/png", "purpose": "any"} for size in (192, 512)],
    }, content_type="application/manifest+json")

@require_GET
def service_worker(request):
    worker = Path(__file__).with_name("static") / "storefront" / "sw.js"
    response = HttpResponse(worker.read_text(encoding="utf-8"), content_type="application/javascript")
    response["Cache-Control"] = "no-cache"
    return response
