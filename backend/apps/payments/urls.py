from django.urls import path
from .views import (
    MpesaSTKPushView, 
    MpesaCallbackView, 
    InitiatePaymentView,
    PayPalCallbackView,
    CardCallbackView
)

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),
    path('mpesa/', MpesaSTKPushView.as_view(), name='mpesa_stk'),
    path('mpesa/stk/', MpesaSTKPushView.as_view(), name='mpesa_stk_alt'),
    path('mpesa/callback/', MpesaCallbackView.as_view(), name='mpesa_callback'),
    path('paypal/callback/', PayPalCallbackView.as_view(), name='paypal_callback'),
    path('card/callback/', CardCallbackView.as_view(), name='card_callback'),
]
