from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            'id', 'order', 'amount', 'payment_method', 'phone',
            'checkout_request_id', 'mpesa_receipt_number',
            'paypal_transaction_id', 'card_last_four', 'card_brand',
            'status', 'created_at'
        )
        read_only_fields = (
            'checkout_request_id', 'mpesa_receipt_number',
            'paypal_transaction_id', 'status', 'created_at'
        )
