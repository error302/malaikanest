import logging
from decimal import Decimal
from typing import Optional

from django.contrib import messages
from django.db import transaction
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views import View

from apps.orders.models import Order, get_delivery_fee_for_region
from apps.orders.services import OrderService
from apps.payments.models import Payment
from apps.payments.services import PaymentService, normalize_phone
from .views_cart import FREE_SHIPPING_THRESHOLD, get_or_create_cart

logger = logging.getLogger(__name__)

BUY_GOODS_TILL_NUMBER = "3370347"


def authorize_order_access(request, order: Order) -> bool:
    """
    Validates whether the requester is authorized to view this order.
    1. Authenticated owner: request.user == order.user.
    2. Staff user: request.user.is_staff.
    3. Guest secret: request.GET.get('token') == order.checkout_token.
    """
    if request.user.is_authenticated:
        if request.user.is_staff or order.user == request.user:
            return True

    token = (request.GET.get("token") or request.POST.get("token") or "").strip()
    if token and token == order.checkout_token:
        return True

    return False


class CheckoutView(View):
    """
    Renders checkout form and creates orders with atomic inventory reservation and payment routing.
    """
    def get(self, request):
        cart = get_or_create_cart(request)
        items = cart.items.select_related("product", "variant").all()
        if not items.exists():
            messages.info(request, "Your shopping bag is empty. Please add items before checking out.")
            return redirect("storefront:cart")

        subtotal = cart.subtotal_amount()
        discount = cart.discount_amount()

        if subtotal >= FREE_SHIPPING_THRESHOLD and subtotal > 0:
            delivery_fee = Decimal("0.00")
            free_shipping_qualified = True
        else:
            delivery_fee = get_delivery_fee_for_region(cart.delivery_region)
            free_shipping_qualified = False

        total = max(Decimal("0.00"), subtotal - discount) + delivery_fee

        context = {
            "cart": cart,
            "items": items,
            "subtotal": subtotal,
            "discount": discount,
            "delivery_fee": delivery_fee,
            "total": total,
            "free_shipping_qualified": free_shipping_qualified,
            "default_region": cart.delivery_region or "nairobi",
            "till_number": BUY_GOODS_TILL_NUMBER,
        }
        return render(request, "storefront/checkout.html", context)

    def post(self, request):
        cart = get_or_create_cart(request)
        if not cart.items.exists():
            messages.error(request, "Your shopping bag is empty.")
            return redirect("storefront:cart")

        # Collect user input
        shipping_name = request.POST.get("shipping_name", "").strip()
        shipping_phone = request.POST.get("shipping_phone", "").strip()
        guest_email = request.POST.get("guest_email", "").strip().lower()
        shipping_address = request.POST.get("shipping_address", "").strip()
        shipping_city = request.POST.get("shipping_city", "").strip()
        shipping_county = request.POST.get("shipping_county", "").strip()
        delivery_region = request.POST.get("delivery_region", "nairobi").strip()
        payment_method = request.POST.get("payment_method", "mpesa").strip()
        mpesa_phone = (request.POST.get("mpesa_phone") or shipping_phone).strip()
        notes = request.POST.get("notes", "").strip()
        is_gift = bool(request.POST.get("is_gift"))
        gift_message = request.POST.get("gift_message", "").strip()

        # Validation
        if not shipping_name:
            messages.error(request, "Please provide your full name.")
            return redirect("storefront:checkout")

        if not shipping_phone:
            messages.error(request, "Please provide a valid contact phone number.")
            return redirect("storefront:checkout")

        if not request.user.is_authenticated and not guest_email:
            messages.error(request, "Please provide an email address for order confirmation and receipts.")
            return redirect("storefront:checkout")

        if not shipping_address:
            messages.error(request, "Please provide your delivery address or building / estate.")
            return redirect("storefront:checkout")

        user = request.user if request.user.is_authenticated else None
        user_email = user.email if user else guest_email

        try:
            # Process checkout and reserve inventory atomically
            order = OrderService.process_checkout(
                cart=cart,
                user=user,
                guest_email=user_email,
                guest_phone=shipping_phone,
                coupon=cart.coupon,
                delivery_region=delivery_region,
                is_gift=is_gift,
                gift_message=gift_message,
                shipping_name=shipping_name,
                shipping_phone=shipping_phone,
                shipping_address=shipping_address,
                shipping_city=shipping_city or delivery_region.title(),
                shipping_county=shipping_county or delivery_region.title(),
                notes=notes,
            )
            order.payment_method = payment_method
            order.save(update_fields=["payment_method"])

        except ValueError as exc:
            logger.warning("Checkout failed for cart #%s: %s", cart.id, str(exc))
            messages.error(request, f"Unable to place order: {exc}")
            return redirect("storefront:checkout")
        except Exception as exc:
            logger.exception("Unexpected error in process_checkout: %s", exc)
            messages.error(request, "An unexpected error occurred while placing your order. Please try again.")
            return redirect("storefront:checkout")

        # Handle chosen payment method
        status_url = reverse("storefront:order_status", kwargs={"receipt_number": order.receipt_number})

        if payment_method == "mpesa":
            phone_to_charge = mpesa_phone or shipping_phone
            try:
                norm_phone = normalize_phone(phone_to_charge)
            except Exception:
                norm_phone = phone_to_charge

            payment, _ = Payment.objects.get_or_create(
                order=order,
                defaults={
                    "amount": order.total,
                    "payment_method": "mpesa",
                    "phone_number": norm_phone,
                    "status": "initiated",
                },
            )

            # Try STK Push
            try:
                checkout_id = PaymentService.initiate_mpesa_stk(payment, norm_phone)
                payment.mpesa_checkout_request_id = checkout_id
                payment.save(update_fields=["mpesa_checkout_request_id", "updated_at"])
                return redirect(f"{status_url}?token={order.checkout_token}&stk=1")
            except Exception as exc:
                logger.warning("STK Push initiation could not be triggered for order %s: %s", order.receipt_number, exc)
                # Fallback to Buy Goods Till instructions so customer can still pay immediately
                messages.info(
                    request,
                    f"Order {order.receipt_number} received! Please complete payment via Buy Goods Till {BUY_GOODS_TILL_NUMBER}."
                )
                return redirect(f"{status_url}?token={order.checkout_token}&till=1")

        elif payment_method == "till":
            Payment.objects.get_or_create(
                order=order,
                defaults={
                    "amount": order.total,
                    "payment_method": "mpesa",
                    "status": "initiated",
                },
            )
            return redirect(f"{status_url}?token={order.checkout_token}&till=1")

        elif payment_method == "paypal":
            payment, _ = Payment.objects.get_or_create(
                order=order,
                defaults={
                    "amount": order.total,
                    "payment_method": "paypal",
                    "status": "initiated",
                },
            )
            try:
                from apps.payments.paypal import PayPalService
                paypal_service = PayPalService()
                ret_url = request.build_absolute_uri(
                    reverse("storefront:paypal_return")
                ) + f"?receipt={order.receipt_number}&token={order.checkout_token}"
                can_url = request.build_absolute_uri(
                    reverse("storefront:order_status", kwargs={"receipt_number": order.receipt_number})
                ) + f"?token={order.checkout_token}"

                result = paypal_service.create_order(
                    order=order,
                    payment=payment,
                    return_url=ret_url,
                    cancel_url=can_url,
                )
                # Find approval URL
                approve_url = None
                for link in result.get("links", []):
                    if link.get("rel") == "approve":
                        approve_url = link.get("href")
                        break

                if approve_url:
                    return redirect(approve_url)

                logger.error("No approve URL in PayPal response: %s", result)
                messages.warning(
                    request,
                    "PayPal could not be opened. You can pay via M-Pesa Buy Goods Till 3370347."
                )
                return redirect(f"{status_url}?token={order.checkout_token}&till=1")

            except Exception as exc:
                logger.exception("PayPal create order failed for order %s: %s", order.receipt_number, exc)
                messages.warning(
                    request,
                    "PayPal checkout is currently unavailable. You may complete payment via M-Pesa Till 3370347."
                )
                return redirect(f"{status_url}?token={order.checkout_token}&till=1")

        # Fallback redirect
        return redirect(f"{status_url}?token={order.checkout_token}")


class PayPalReturnView(View):
    """
    Captures authorized PayPal payment when redirected back from PayPal.
    """
    def get(self, request):
        receipt_number = request.GET.get("receipt")
        checkout_token = request.GET.get("token")
        paypal_order_id = request.GET.get("token")  # PayPal sends token=<order_id>

        order = Order.objects.filter(receipt_number=receipt_number).first()
        if not order:
            messages.error(request, "Order not found.")
            return redirect("storefront:home")

        payment = Payment.objects.filter(order=order, payment_method="paypal").order_by("-created_at").first()
        if not payment:
            messages.error(request, "Payment record not found.")
            return redirect(reverse("storefront:order_status", kwargs={"receipt_number": order.receipt_number}))

        try:
            from apps.payments.paypal import PayPalService
            paypal_service = PayPalService()
            paypal_service.capture_order(paypal_order_id, payment)
            messages.success(request, "PayPal payment captured successfully! Thank you for your order.")
        except Exception as exc:
            logger.exception("PayPal capture failed for order %s: %s", order.receipt_number, exc)
            messages.error(request, "PayPal payment capture encountered an issue. Our team has been notified.")

        return redirect(
            reverse("storefront:order_status", kwargs={"receipt_number": order.receipt_number})
            + f"?token={order.checkout_token}"
        )


class OrderStatusView(View):
    """
    Displays the live status of an order, M-Pesa PIN prompt modal or Till fallback instructions.
    """
    def get(self, request, receipt_number):
        order = get_object_or_404(
            Order.objects.select_related("coupon").prefetch_related("items__product"),
            receipt_number=receipt_number
        )

        if not authorize_order_access(request, order):
            raise Http404("Order not found or authorization token missing.")

        payment = Payment.objects.filter(order=order).order_by("-created_at").first()

        is_paid = order.status in ["paid", "processing", "shipped", "delivered"]
        show_stk_modal = bool(request.GET.get("stk")) and not is_paid
        show_till_instructions = bool(request.GET.get("till")) or (order.status == "pending" and not is_paid)

        context = {
            "order": order,
            "items": order.items.all(),
            "payment": payment,
            "is_paid": is_paid,
            "show_stk_modal": show_stk_modal,
            "show_till_instructions": show_till_instructions,
            "till_number": BUY_GOODS_TILL_NUMBER,
            "checkout_token": order.checkout_token,
            "whatsapp_order_link": (
                f"https://wa.me/254726771321?text=Hello%20Malaika%20Nest%2C%20I%20am%20inquiring%20about%20Order%20{order.receipt_number}"
            ),
        }
        return render(request, "storefront/order_status.html", context)


class OrderStatusPollView(View):
    """
    Lightweight JSON endpoint for the browser to poll order payment status every 3-5 seconds.
    """
    def get(self, request, receipt_number):
        token = request.GET.get("token", "").strip()
        order = Order.objects.filter(receipt_number=receipt_number).first()
        if not order:
            return JsonResponse({"error": "Order not found"}, status=404)

        if not authorize_order_access(request, order):
            return JsonResponse({"error": "Unauthorized"}, status=403)

        payment = Payment.objects.filter(order=order).order_by("-created_at").first()

        is_paid = order.status in ["paid", "processing", "shipped", "delivered"]
        return JsonResponse({
            "receipt_number": order.receipt_number,
            "status": order.status,
            "status_display": order.get_status_display(),
            "is_paid": is_paid,
            "mpesa_receipt": order.mpesa_receipt_number or (payment.mpesa_receipt_number if payment else ""),
        })
