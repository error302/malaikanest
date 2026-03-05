from django.urls import path
from .views import (
    MpesaSTKPushView,
    MpesaCallbackView,
    InitiatePaymentView,
    MpesaInitiateAndPushView,
    PayPalCallbackView,
    CardCallbackView,
)

urlpatterns = [
    # Step 1: Create payment record
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),
    # Step 2: Trigger STK push (requires payment_id from step 1)
    path('mpesa/stk/', MpesaSTKPushView.as_view(), name='mpesa_stk'),
    # CRIT-10: Consolidated endpoint — creates payment + triggers STK in one call
    # Frontend should use this endpoint with { order_id, phone }
    path('mpesa/pay/', MpesaInitiateAndPushView.as_view(), name='mpesa_pay'),
    # Legacy alias kept for backward compat (now points to consolidated endpoint)
    path('mpesa/', MpesaInitiateAndPushView.as_view(), name='mpesa_pay_legacy'),
    # Safaricom callback (csrf_exempt, IP validated)
    path('mpesa/callback/', MpesaCallbackView.as_view(), name='mpesa_callback'),
    # Placeholder callbacks (return 501 until implemented)
    path('paypal/callback/', PayPalCallbackView.as_view(), name='paypal_callback'),
    path('card/callback/', CardCallbackView.as_view(), name='card_callback'),
]
