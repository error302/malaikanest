from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'amount', 'phone', 'status', 'mpesa_receipt_number', 'created_at')
    search_fields = ('checkout_request_id', 'mpesa_receipt_number', 'order__receipt_number')
    readonly_fields = ('raw_callback',)
