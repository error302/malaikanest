"""
Views for the GDPR-compliant personal data export feature.

Endpoints:
- POST   /api/v1/core/data-exports/request/    → request a new export (1/24h)
- GET    /api/v1/core/data-exports/             → list user's export requests
- GET    /api/v1/core/data-exports/{id}/        → check status of one export
- GET    /api/v1/core/data-exports/{id}/download/  → download the archive
"""

import logging

from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle, UserRateThrottle

from .models import DataExportRequest
from .tasks import generate_data_export_task

logger = logging.getLogger("apps.core")


class DataExportRequestThrottle(ScopedRateThrottle):
    scope = "data_export"


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([DataExportRequestThrottle])
def request_data_export(request):
    """
    Request a new personal data export.

    Rate-limited to 1 per 24 hours per user. Triggers an async Celery task
    that gathers the user's profile, orders, payments, reviews, addresses,
    wishlist, etc. into a downloadable JSON archive.
    """
    user = request.user
    now = timezone.now()

    # Check for a recent export (within 24h) in any active state
    cooldown = now - timezone.timedelta(hours=24)
    recent = DataExportRequest.objects.filter(
        user=user,
        created_at__gte=cooldown,
    ).exclude(
        status=DataExportRequest.STATUS_EXPIRED,
    ).exists()

    if recent:
        return Response(
            {
                "detail": "You have already requested a data export within the last 24 hours. "
                          "Please wait before requesting another.",
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    # Create the export request
    export = DataExportRequest.objects.create(
        user=user,
        status=DataExportRequest.STATUS_PENDING,
    )

    # Dispatch async generation
    generate_data_export_task.delay(str(export.id))

    logger.info("DataExportRequest %s created for user %s", export.id, user.email)

    return Response(
        {
            "id": export.id,
            "status": export.status,
            "message": "Your data export is being generated. You will receive an email when it's ready.",
            "created_at": export.created_at,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def list_data_exports(request):
    """List all of the authenticated user's data export requests, newest first."""
    user = request.user
    exports = DataExportRequest.objects.filter(user=user).order_by("-created_at")

    results = []
    for export in exports:
        results.append({
            "id": export.id,
            "status": export.status,
            "archive_size": export.archive_size,
            "error_message": export.error_message if export.status == DataExportRequest.STATUS_FAILED else None,
            "is_downloadable": export.status == DataExportRequest.STATUS_READY and (
                export.expires_at is None or export.expires_at > timezone.now()
            ),
            "expires_at": export.expires_at.isoformat() if export.expires_at else None,
            "created_at": export.created_at.isoformat() if export.created_at else None,
            "notification_sent_at": export.notification_sent_at.isoformat() if export.notification_sent_at else None,
        })

    return Response({"results": results})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def data_export_status(request, export_id: str):
    """Check the status of a single data export request."""
    user = request.user
    try:
        export = DataExportRequest.objects.get(id=export_id, user=user)
    except DataExportRequest.DoesNotExist:
        return Response(
            {"detail": "Data export request not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({
        "id": export.id,
        "status": export.status,
        "archive_size": export.archive_size,
        "error_message": export.error_message if export.status == DataExportRequest.STATUS_FAILED else None,
        "is_downloadable": export.status == DataExportRequest.STATUS_READY and (
            export.expires_at is None or export.expires_at > timezone.now()
        ),
        "expires_at": export.expires_at.isoformat() if export.expires_at else None,
        "created_at": export.created_at.isoformat() if export.created_at else None,
        "notification_sent_at": export.notification_sent_at.isoformat() if export.notification_sent_at else None,
    })


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def download_data_export(request, export_id: str):
    """
    Download the generated data export archive.

    The file is served as a JSON download with Content-Disposition: attachment.
    Expired or failed exports return a 404/410.
    """
    user = request.user
    now = timezone.now()

    try:
        export = DataExportRequest.objects.get(id=export_id, user=user)
    except DataExportRequest.DoesNotExist:
        return Response(
            {"detail": "Data export request not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if export.status != DataExportRequest.STATUS_READY:
        return Response(
            {"detail": f"Data export is not ready (status: {export.status})."},
            status=(
                status.HTTP_410_GONE
                if export.status in (DataExportRequest.STATUS_EXPIRED,)
                else status.HTTP_400_BAD_REQUEST
            ),
        )

    if export.expires_at and export.expires_at <= now:
        # Mark as expired and return a 410
        export.status = DataExportRequest.STATUS_EXPIRED
        if export.archive_file and export.archive_file.name:
            try:
                storage_path = export.archive_file.name
                export.archive_file.delete(save=False)
            except Exception:
                pass
        export.archive_file = None
        export.archive_size = 0
        export.save(update_fields=["archive_file", "archive_size", "status", "updated_at"])
        return Response(
            {"detail": "This data export has expired. Please request a new one."},
            status=status.HTTP_410_GONE,
        )

    if not export.archive_file or not export.archive_file.name:
        return Response(
            {"detail": "Data export file is missing. Please request a new one."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        from django.http import FileResponse

        response = FileResponse(
            export.archive_file.open("rb"),
            as_attachment=True,
            filename=f"malaikanest-data-export-{export_id[:12]}.json",
        )
        response["Content-Length"] = export.archive_size
        response["X-Content-Type-Options"] = "nosniff"
        return response
    except Exception as exc:
        logger.error("DataExport %s download failed: %s", export.id, exc)
        return Response(
            {"detail": "Failed to read the export file. Please request a new one."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
