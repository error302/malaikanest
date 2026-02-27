import os
import base64
import datetime
import logging
import requests
from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from apps.orders.models import Order
from .models import Payment
from .serializers import PaymentSerializer
from .tasks import verify_mpesa_payment_async

logger = logging.getLogger('apps.payments')


class InitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @method_decorator(ratelimit(key='ip', rate='10/m', block=True))
    def post(self, request):
        order_id = request.data.get('order_id')
        payment_method = request.data.get('payment_method', 'mpesa')
        
        if payment_method not in ['mpesa', 'paypal', 'card']:
            return Response({'detail': 'Invalid payment method'}, status=status.HTTP_400_BAD_REQUEST)
        
        if payment_method == 'mpesa':
            phone = request.data.get('phone')
            if not phone:
                return Response({'detail': 'phone required for M-Pesa'}, status=status.HTTP_400_BAD_REQUEST)
        
        order = Order.objects.filter(pk=order_id, user=request.user).first()
        if not order:
            return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if order.status != 'pending':
            return Response({'detail': 'Order not in pending state'}, status=status.HTTP_400_BAD_REQUEST)
        
        payment = Payment.objects.create(
            order=order,
            amount=order.total,
            payment_method=payment_method,
            phone=request.data.get('phone'),
            status='initiated'
        )
        
        if payment_method == 'mpesa':
            return Response({'payment_id': payment.id, 'payment_method': 'mpesa'})
        elif payment_method == 'paypal':
            return Response(self._create_paypal_order(payment))
        elif payment_method == 'card':
            return Response(self._create_card_session(payment))
    
    def _create_paypal_order(self, payment):
        paypal_client_id = os.getenv('PAYPAL_CLIENT_ID')
        paypal_secret = os.getenv('PAYPAL_SECRET')
        
        if not paypal_client_id or not paypal_secret:
            payment.status = 'failed'
            payment.save()
            return {'detail': 'PayPal not configured'}, status.HTTP_502_BAD_GATEWAY
        
        auth_url = 'https://api-m.sandbox.paypal.com/v1/oauth2/token'
        resp = requests.post(auth_url, auth=(paypal_client_id, paypal_secret), data={'grant_type': 'client_credentials'})
        if resp.status_code != 200:
            payment.status = 'failed'
            payment.save()
            return {'detail': 'PayPal auth failed'}
        
        access_token = resp.json()['access_token']
        order_url = 'https://api-m.sandbox.paypal.com/v2/checkout/orders'
        headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}
        payload = {
            'intent': 'CAPTURE',
            'purchase_units': [{
                'reference_id': str(payment.id),
                'amount': {'currency_code': 'USD', 'value': str(float(payment.amount) / 140)},
            }]
        }
        resp = requests.post(order_url, json=payload, headers=headers)
        if resp.status_code == 201:
            data = resp.json()
            payment.paypal_transaction_id = data['id']
            payment.save()
            return {'payment_id': payment.id, 'paypal_order_id': data['id'], 'approval_link': next(link['href'] for link in data['links'] if link['rel'] == 'approve')}
        
        payment.status = 'failed'
        payment.save()
        return {'detail': 'PayPal order creation failed'}
    
    def _create_card_session(self, payment):
        stripe_key = os.getenv('STRIPE_PUBLISHABLE_KEY')
        if not stripe_key:
            payment.status = 'failed'
            payment.save()
            return {'detail': 'Card payments not configured'}
        
        return {
            'payment_id': payment.id,
            'payment_method': 'card',
            'stripe_publishable_key': stripe_key,
            'amount': str(payment.amount),
            'order_id': payment.order.id
        }


class MpesaSTKPushView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @method_decorator(ratelimit(key='ip', rate='10/m', block=True))
    def post(self, request):
        order_id = request.data.get('order_id')
        phone = request.data.get('phone')
        if not order_id or not phone:
            return Response({'detail': 'order_id and phone required'}, status=status.HTTP_400_BAD_REQUEST)
        # lock order row to avoid races
        with transaction.atomic():
            order = Order.objects.select_for_update().filter(pk=order_id, user=request.user).first()
            if not order:
                return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

            if order.status != 'pending':
                return Response({'detail': 'Order not in pending state'}, status=status.HTTP_400_BAD_REQUEST)

            # Support for delivery regions and gifting updates at checkout
            delivery_region = request.data.get('deliveryRegion')
            is_gift = request.data.get('isGift')
            gift_message = request.data.get('giftMessage')
            
            if delivery_region in ['nairobi', 'upcountry']:
                order.delivery_region = delivery_region
                # Example: Add 500 for upcountry, normally handled in cart but injecting here for demo
                if delivery_region == 'upcountry' and getattr(order, 'total') < getattr(order, 'total') + 500:
                    order.total = float(order.total) + 500
            
            if is_gift is not None:
                order.is_gift = bool(is_gift)
                order.gift_message = gift_message or ''
            
            order.save(update_fields=['delivery_region', 'is_gift', 'gift_message', 'total'])

            # Create or retrieve payment row
            payment, created = Payment.objects.get_or_create(order=order, defaults={'amount': order.total, 'phone': phone})
            if not created and payment.status == 'completed':
                return Response({'detail': 'Order already paid'}, status=status.HTTP_400_BAD_REQUEST)

            # Prepare STK push credentials
            consumer_key = os.getenv('MPESA_CONSUMER_KEY')
            consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
            shortcode = os.getenv('MPESA_SHORTCODE')
            passkey = os.getenv('MPESA_PASSKEY')
            callback_url = os.getenv('MPESA_CALLBACK_URL')

            # Get token
            token_url = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
            try:
                token_resp = requests.get(token_url, auth=(consumer_key, consumer_secret), timeout=10)
                token_resp.raise_for_status()
            except Exception as e:
                logger.exception('Failed to obtain MPESA token')
                return Response({'detail': 'Payment gateway error'}, status=status.HTTP_502_BAD_GATEWAY)

            access_token = token_resp.json().get('access_token')

            timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            password_str = f"{shortcode}{passkey}{timestamp}"
            password = base64.b64encode(password_str.encode()).decode()

            stk_url = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}
            payload = {
                'BusinessShortCode': shortcode,
                'Password': password,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': str(payment.amount),
                'PartyA': phone,
                'PartyB': shortcode,
                'PhoneNumber': phone,
                'CallBackURL': callback_url,
                'AccountReference': f'Order-{order.id}',
                'TransactionDesc': f'Payment for order {order.id}'
            }

            try:
                resp = requests.post(stk_url, json=payload, headers=headers, timeout=30)
                resp.raise_for_status()
            except Exception as e:
                logger.exception('STK push failed')
                return Response({'detail': 'STK push failed'}, status=status.HTTP_502_BAD_GATEWAY)

            data = resp.json()
            checkout_request_id = data.get('CheckoutRequestID')
            if not checkout_request_id:
                logger.error('No CheckoutRequestID in response: %s', data)
                return Response({'detail': 'No CheckoutRequestID returned', 'response': data}, status=502)

            # store checkout id
            payment.checkout_request_id = checkout_request_id
            payment.status = 'initiated'
            payment.save()

            # schedule verification task (in case callback delayed)
            verify_mpesa_payment_async.apply_async((payment.id,), countdown=60)

            return Response({'detail': 'STK initiated', 'checkout_request_id': checkout_request_id})


class MpesaCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    @method_decorator(ratelimit(key='ip', rate='60/m', block=False))
    def post(self, request):
        raw = request.data
        # Store raw callback quickly
        checkout_id = raw.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')
        with transaction.atomic():
            payment = None
            if checkout_id:
                payment = Payment.objects.select_for_update().filter(checkout_request_id=checkout_id).first()
            # If no payment found by checkout id, try to match by account reference / receipt
            if not payment:
                merchant_request_id = raw.get('Body', {}).get('stkCallback', {}).get('MerchantRequestID')
                payment = Payment.objects.select_for_update().filter(order__receipt_number=merchant_request_id).first()

            if not payment:
                # store payload for manual reconciliation
                Payment.objects.create(amount=0, phone='', raw_callback=raw, status='failed')
                logger.warning('MPESA callback with no matching payment: %s', raw)
                return JsonResponse({'result': 'no matching payment'}, status=200)

            # Prevent duplicate processing
            if payment.status == 'completed':
                payment.raw_callback = raw
                payment.save(update_fields=['raw_callback', 'updated_at'])
                logger.info('Duplicate callback for payment %s', payment.id)
                return JsonResponse({'result': 'already processed'}, status=200)

            payment.raw_callback = raw
            callback_result = raw.get('Body', {}).get('stkCallback', {})
            result_code = callback_result.get('ResultCode')
            callback_metadata = callback_result.get('CallbackMetadata', {})

            if result_code == 0:
                items = {it.get('Name'): it.get('Value') for it in callback_metadata.get('Item', [])}
                receipt = items.get('MpesaReceiptNumber')
                amount = items.get('Amount')
                phone = items.get('PhoneNumber')

                # Validate amount matches order
                try:
                    if float(amount) != float(payment.amount):
                        payment.status = 'failed'
                        payment.raw_callback = raw
                        payment.save()
                        logger.error('Amount mismatch for payment %s: expected %s got %s', payment.id, payment.amount, amount)
                        return JsonResponse({'result': 'amount mismatch'}, status=400)
                except Exception:
                    payment.status = 'failed'
                    payment.raw_callback = raw
                    payment.save()
                    return JsonResponse({'result': 'invalid amount'}, status=400)

                # Validate phone
                normalized = str(phone).lstrip('+').replace(' ', '')
                if not normalized.endswith(payment.phone.replace('+', '').replace(' ', '')):
                    payment.status = 'failed'
                    payment.raw_callback = raw
                    payment.save()
                    logger.error('Phone mismatch for payment %s: expected %s got %s', payment.id, payment.phone, phone)
                    return JsonResponse({'result': 'phone mismatch'}, status=400)

                # mark payment completed and mark order paid atomically
                payment.mpesa_receipt_number = receipt
                payment.status = 'completed'
                payment.save()

                order = payment.order
                if order.status != 'paid':
                    order.status = 'paid'
                    order.save()
                logger.info('Payment %s completed for order %s', payment.id, order.id)
                return JsonResponse({'result': 'ok'}, status=200)
            else:
                payment.status = 'failed'
                payment.raw_callback = raw
                payment.save()
                logger.info('Payment %s failed with result code %s', payment.id, result_code)
                return JsonResponse({'result': 'failed'}, status=200)


class PayPalCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        paypal_order_id = request.data.get('order_id')
        payment_id = request.data.get('payment_id')
        
        with transaction.atomic():
            payment = Payment.objects.select_for_update().filter(
                id=payment_id,
                paypal_transaction_id=paypal_order_id
            ).first()
            
            if not payment:
                logger.warning('PayPal callback with no matching payment: %s', request.data)
                return Response({'detail': 'Payment not found'}, status=404)
            
            if payment.status == 'completed':
                return Response({'detail': 'already processed'})
            
            import os
            paypal_client_id = os.getenv('PAYPAL_CLIENT_ID')
            paypal_secret = os.getenv('PAYPAL_SECRET')
            
            auth_url = 'https://api-m.sandbox.paypal.com/v1/oauth2/token'
            resp = requests.post(auth_url, auth=(paypal_client_id, paypal_secret), data={'grant_type': 'client_credentials'})
            access_token = resp.json()['access_token']
            
            capture_url = f'https://api-m.sandbox.paypal.com/v2/checkout/orders/{paypal_order_id}/capture'
            headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}
            resp = requests.post(capture_url, json={}, headers=headers)
            
            if resp.status_code == 201:
                data = resp.json()
                if data['status'] == 'COMPLETED':
                    payment.status = 'completed'
                    payment.paypal_transaction_id = data['id']
                    payment.save()
                    
                    order = payment.order
                    if order.status != 'paid':
                        order.status = 'paid'
                        order.save()
                    return Response({'detail': 'ok'})
            
            payment.status = 'failed'
            payment.save()
            return Response({'detail': 'Payment failed'})


class CardCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payment_id = request.data.get('payment_id')
        stripe_payment_intent = request.data.get('payment_intent_id')
        
        with transaction.atomic():
            payment = Payment.objects.select_for_update().filter(id=payment_id).first()
            
            if not payment:
                logger.warning('Card callback with no matching payment: %s', request.data)
                return Response({'detail': 'Payment not found'}, status=404)
            
            if payment.status == 'completed':
                return Response({'detail': 'already processed'})
            
            import stripe
            stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
            
            try:
                intent = stripe.PaymentIntent.retrieve(stripe_payment_intent)
                if intent.status == 'succeeded':
                    payment.status = 'completed'
                    payment.card_last_four = intent.card.last4
                    payment.card_brand = intent.card.brand
                    payment.save()
                    
                    order = payment.order
                    if order.status != 'paid':
                        order.status = 'paid'
                        order.save()
                    return Response({'detail': 'ok'})
            except Exception as e:
                logger.exception('Stripe payment verification failed')
            
            payment.status = 'failed'
            payment.save()
            return Response({'detail': 'Payment failed'})
