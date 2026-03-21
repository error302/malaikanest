from django.contrib import admin, messages

from .models import Payment, PaymentAuditLog
from .tasks import verify_mpesa_payment_async, reconcile_payments_task


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
    readonly_fields = ("raw_callback_json",)
    list_filter = ("status", "payment_method", "created_at")
    actions = ("queue_reconcile_selected", "queue_reconcile_stale")

    @admin.action(description="Queue reconciliation for selected payments")
    def queue_reconcile_selected(self, request, queryset):
        queued = 0
        for payment in queryset:
            if payment.payment_method != "mpesa":
                continue
            verify_mpesa_payment_async.delay(payment.id)
            queued += 1

        self.message_user(
            request,
            f"Queued reconciliation for {queued} payment(s).",
            level=messages.SUCCESS,
        )

    @admin.action(description="Queue reconciliation for stale initiated payments")
    def queue_reconcile_stale(self, request, queryset):
        reconcile_payments_task.delay()
        self.message_user(
            request,
            "Queued stale-payment reconciliation task.",
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
