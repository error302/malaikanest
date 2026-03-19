from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from django.conf import settings
from django.core.mail import send_mail
from django.core.cache import cache
from django.db import connection
import logging

from rest_framework.parsers import JSONParser, FormParser, MultiPartParser

from .models import SiteSettings
from .serializers import PublicSiteSettingsSerializer, SiteSettingsSerializer

logger = logging.getLogger("apps.core")


class HealthCheckView(APIView):
    """Health check endpoint for monitoring"""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        checks = {}
        all_healthy = True

        # Database check
        try:
            connection.ensure_connection()
            checks["database"] = "ok"
        except Exception:
            logger.warning("Health check: database connection failed")
            checks["database"] = "error"
            all_healthy = False

        # Redis cache check
        try:
            cache.set("health_check", "1", 10)
            if cache.get("health_check") == "1":
                checks["cache"] = "ok"
            else:
                checks["cache"] = "error"
                all_healthy = False
        except Exception:
            logger.warning("Health check: cache connection failed")
            checks["cache"] = "error"
            all_healthy = False

        status_code = 200 if all_healthy else 503
        return Response(
            {
                "status": "healthy" if all_healthy else "degraded",
                "checks": checks,
            },
            status=status_code,
        )


class ContactFormThrottle(AnonRateThrottle):
    rate = "5/hour"
    scope = "contact_form"


class ContactFormView(APIView):
    """Receive contact form submissions and email them to the store owner."""

    permission_classes = [AllowAny]
    throttle_classes = [ContactFormThrottle]

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip()
        phone = (request.data.get("phone") or "").strip()
        subject = (request.data.get("subject") or "Contact Form").strip()
        message = (request.data.get("message") or "").strip()

        if not name or not email or not message:
            return Response(
                {"detail": "Name, email, and message are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        recipient = getattr(settings, "DEFAULT_FROM_EMAIL", "malaikanest7@gmail.com")
        # Extract plain address if it has display name format
        if "<" in recipient and ">" in recipient:
            recipient = recipient.split("<")[1].rstrip(">").strip()

        body = (
            f"New message from your Malaika Nest contact form\n"
            f"{'=' * 50}\n\n"
            f"Name:    {name}\n"
            f"Email:   {email}\n"
            f"Phone:   {phone or 'Not provided'}\n"
            f"Subject: {subject}\n\n"
            f"Message:\n{message}\n\n"
            f"{'=' * 50}\n"
            f"Reply directly to: {email}"
        )

        try:
            send_mail(
                subject=f"[Malaika Nest] {subject}",
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            logger.info("Contact form email sent from %s (%s)", email, name)
            return Response(
                {"detail": "Message sent successfully."}, status=status.HTTP_200_OK
            )
        except Exception as exc:
            logger.error("Contact form email failed: %s", exc)
            return Response(
                {
                    "detail": "Failed to send message. Please try again or contact us directly."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


PUBLIC_SETTINGS_CACHE_KEY = "core_public_site_settings_v1"


class SiteSettingsView(APIView):
    """Get and update site settings"""

    permission_classes = [IsAdminUser]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request):
        obj = SiteSettings.get_solo()
        data = SiteSettingsSerializer(obj, context={"request": request}).data
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request):
        obj = SiteSettings.get_solo()
        serializer = SiteSettingsSerializer(obj, data=request.data, partial=False, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        cache.delete(PUBLIC_SETTINGS_CACHE_KEY)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        obj = SiteSettings.get_solo()
        serializer = SiteSettingsSerializer(obj, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        cache.delete(PUBLIC_SETTINGS_CACHE_KEY)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PublicSettingsView(APIView):
    """Public endpoint to get site settings (for frontend)"""

    permission_classes = [AllowAny]

    def get(self, request):
        cached = cache.get(PUBLIC_SETTINGS_CACHE_KEY)
        if cached is not None:
            return Response(cached, status=status.HTTP_200_OK)

        obj = SiteSettings.get_solo()
        data = PublicSiteSettingsSerializer(obj, context={"request": request}).data
        cache.set(PUBLIC_SETTINGS_CACHE_KEY, data, timeout=300)  # 5 min
        return Response(data, status=status.HTTP_200_OK)


class Pm2LogsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        import os

        log_path = os.path.expanduser("~/.pm2/logs/frontend-error.log")
        try:
            with open(log_path, "r") as f:
                lines = f.readlines()
                return Response({"logs": lines[-200:]})
        except Exception:
            logger.warning("PM2 logs endpoint: failed to read log file")
            return Response({"error": "Unable to read log file"})
