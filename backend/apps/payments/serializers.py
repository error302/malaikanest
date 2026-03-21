from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source="phone_number", allow_null=True, required=False)
    checkout_request_id = serializers.CharField(source="mpesa_checkout_request_id", read_only=True)
    raw_callback = serializers.JSONField(source="raw_callback_json", read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'order', 'amount', 'payment_method', 'phone',
            'checkout_request_id', 'mpesa_receipt_number',
            'paypal_transaction_id', 'card_last_four', 'card_brand',
            'status', 'raw_callback', 'created_at'
        )
        read_only_fields = (
            'checkout_request_id', 'mpesa_receipt_number',
            'paypal_transaction_id', 'status', 'raw_callback', 'created_at'
        )
