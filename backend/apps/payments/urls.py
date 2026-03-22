from django.urls import path

from .views import (
    AdminReconcileCandidatesView,
    AdminReconcilePaymentsView,
    CardCallbackView,
    InitiatePaymentView,
    MpesaCallbackView,
    MpesaInitiateView,
    MpesaInitiateAndPushView,
    MpesaSTKPushView,
    PaymentStatusByIdView,
    PaymentVerifyView,
    PayPalCallbackView,
)

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),
    path('mpesa/stk/', MpesaSTKPushView.as_view(), name='mpesa_stk'),
    path('mpesa/pay/', MpesaInitiateAndPushView.as_view(), name='mpesa_pay'),
    path('mpesa/initiate/', MpesaInitiateView.as_view(), name='mpesa_initiate'),
    path('mpesa/', MpesaInitiateAndPushView.as_view(), name='mpesa_pay_legacy'),
    path('mpesa/callback/', MpesaCallbackView.as_view(), name='mpesa_callback'),
    # Polling endpoint: frontend polls this every 3s after STK push (2-minute window)
    path('<int:pk>/status/', PaymentStatusByIdView.as_view(), name='payment_status_by_id'),
    path('verify/<str:checkout_request_id>/', PaymentVerifyView.as_view(), name='payment_verify'),
    path('paypal/callback/', PayPalCallbackView.as_view(), name='paypal_callback'),
    path('card/callback/', CardCallbackView.as_view(), name='card_callback'),
    path('admin/reconcile/', AdminReconcilePaymentsView.as_view(), name='admin_reconcile_payments'),
    path('admin/reconcile/candidates/', AdminReconcileCandidatesView.as_view(), name='admin_reconcile_candidates'),
]
