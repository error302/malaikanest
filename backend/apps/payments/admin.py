from django.contrib import admin, messages

from .models import Payment, PaymentAuditLog
from .mpesa_verification import schedule_verification
from django.utils import timezone
from datetime import timedelta


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "amount",
        "phone",
        "status",
        "mpesa_receipt_number",
        "checkout_request_id",
        "created_at",
    )
    search_fields = ("mpesa_checkout_request_id", "mpesa_receipt_number", "order__receipt_number")
    readonly_fields = (
        "raw_callback_json", "mpesa_merchant_request_id", "mpesa_sent_amount", "mpesa_shortcode",
        "mpesa_destination", "mpesa_next_query_at", "mpesa_query_attempts", "mpesa_query_lease_until",
        "mpesa_issue", "mpesa_callback_summary", "mpesa_statement_verified_at",
    )
    list_filter = ("status", "payment_method", "created_at")
    actions = ("queue_reconcile_selected", "queue_reconcile_stale")

    @admin.action(description="Queue reconciliation for selected payments")
    def queue_reconcile_selected(self, request, queryset):
        queued = schedule_verification(queryset)

        self.message_user(
            request,
            f"Queued reconciliation for {queued} payment(s).",
            level=messages.SUCCESS,
        )

    @admin.action(description="Queue reconciliation for stale initiated payments")
    def queue_reconcile_stale(self, request, queryset):
        cutoff = timezone.now() - timedelta(minutes=10)
        queued = schedule_verification(Payment.objects.filter(initiated_at__lt=cutoff))
        self.message_user(
            request,
            f"Queued {queued} stale M-Pesa payments.",
            level=messages.SUCCESS,
        )


@admin.register(PaymentAuditLog)
class PaymentAuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "event_type",
        "payment",
        "checkout_request_id",
        "result_code",
        "request_ip",
        "created_at",
    )
    search_fields = (
        "checkout_request_id",
        "merchant_request_id",
        "payload_hash",
        "payment__order__receipt_number",
    )
    list_filter = ("event_type", "source", "created_at")
    readonly_fields = (
        "payment",
        "event_type",
        "source",
        "request_ip",
        "checkout_request_id",
        "merchant_request_id",
        "result_code",
        "payload_hash",
        "payload",
        "notes",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
