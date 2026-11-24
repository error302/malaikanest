import logging
import re
from decimal import Decimal
from typing import Optional

from django.contrib import messages
from django.db import transaction
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views import View
from django.utils.cache import add_never_cache_headers

from apps.orders.models import Order, get_delivery_fee_for_region
from apps.orders.services import OrderService
from apps.payments.models import Payment
from apps.payments.services import PaymentService, StkInitiationUncertain, normalize_phone
from .views_cart import get_free_shipping_threshold, get_or_create_cart

logger = logging.getLogger(__name__)

BUY_GOODS_TILL_NUMBER = "3370347"


def authorize_order_access(request, order: Order) -> bool:
    """
    Validates whether the requester is authorized to view this order.
    1. Authenticated owner: request.user == order.user.
    2. Staff user: request.user.is_staff.
    3. Guest secret: request.GET.get('token') == order.checkout_token.
    4. Session token cache.
    5. Contact verification: phone number or email matches the order.
    """
    if request.user.is_authenticated:
        if request.user.is_staff or order.user == request.user:
            return True

    # 1. URL or payload token
    token = (request.GET.get("token") or request.POST.get("token") or "").strip()
    if token and token == order.checkout_token:
        request.session[f"order_token_{order.receipt_number}"] = order.checkout_token
        return True

    # 2. Browser session cache
    if request.session.get(f"order_token_{order.receipt_number}") == order.checkout_token:
        return True

    # 3. Direct phone or email verification
    verify = (request.GET.get("verify") or request.POST.get("verify") or "").strip().lower()
    if verify:
        phone_digits = re.sub(r"[^\d]", "", verify)
        order_phone = re.sub(r"[^\d]", "", (order.shipping_phone or getattr(order, "guest_phone", "") or ""))
        guest_email = (getattr(order, "guest_email", "") or "").lower()
        user_email = (getattr(order.user, "email", "") or "").lower() if order.user else ""

        if verify in (guest_email, user_email):
            request.session[f"order_token_{order.receipt_number}"] = order.checkout_token
            return True
        if phone_digits and len(phone_digits) >= 9 and phone_digits[-9:] in order_phone:
            request.session[f"order_token_{order.receipt_number}"] = order.checkout_token
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
        free_shipping_threshold = get_free_shipping_threshold()

        if subtotal >= free_shipping_threshold and subtotal > 0:
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
            "free_shipping_threshold": free_shipping_threshold,
            "region_fees": {
                "mombasa_pickup": str(get_delivery_fee_for_region("mombasa_pickup")),
                "mombasa": str(get_delivery_fee_for_region("mombasa")),
                "nairobi": str(get_delivery_fee_for_region("nairobi")),
                "upcountry": str(get_delivery_fee_for_region("upcountry")),
            },
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

        is_store_pickup = delivery_region == "mombasa_pickup"
        if is_store_pickup:
            if not shipping_address:
                shipping_address = "Store Pickup — Tawakal Toto Wear, Likoni, Mombasa"
            if not shipping_city:
                shipping_city = "Mombasa"
            if not shipping_county:
                shipping_county = "Mombasa"

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

        if not is_store_pickup and not shipping_address:
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
            request.session[f"order_token_{order.receipt_number}"] = order.checkout_token

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
                PaymentService.initiate_mpesa_stk(payment, norm_phone)
            except StkInitiationUncertain:
                return redirect(status_url)
            except ValueError:
                messages.info(request, "The M-Pesa prompt could not be started. You can use the Buy Goods Till.")
            return redirect(status_url)

        elif payment_method == "till":
            Payment.objects.get_or_create(
                order=order,
                defaults={
                    "amount": order.total,
                    "payment_method": "mpesa",
                    "status": "initiated",
                },
            )
            return redirect(status_url)

        elif payment_method == "paypal":
            messages.warning(
                request,
                "PayPal checkout is currently undergoing scheduled maintenance. Please complete your payment via M-Pesa Buy Goods Till 3370347."
            )
            return redirect(status_url)

        # Fallback redirect
        return redirect(status_url)


class PayPalReturnView(View):
    """
    Captures authorized PayPal payment when redirected back from PayPal.
    Enforces session/owner authorization so an attacker cannot probe arbitrary receipts
    or receive an order's secret checkout token.
    """
    def get(self, request):
        receipt_number = (request.GET.get("receipt") or "").strip()
        paypal_order_id = (request.GET.get("token") or "").strip()

        if not receipt_number or not paypal_order_id:
            messages.error(request, "Invalid payment return parameters.")
            return redirect("storefront:home")

        order = Order.objects.filter(receipt_number__iexact=receipt_number).first()
        if not order:
            messages.error(request, "Order not found.")
            return redirect("storefront:home")

        # G01 Security Check: Caller must be the authenticated owner or hold the session token
        session_token = request.session.get(f"order_token_{order.receipt_number}")
        is_owner = (request.user.is_authenticated and order.user == request.user)
        is_session_auth = bool(session_token and session_token == order.checkout_token)

        if not (is_owner or is_session_auth):
            logger.warning(
                "Unauthorized PayPal return attempt for order %s from IP %s",
                order.receipt_number,
                request.META.get("REMOTE_ADDR"),
            )
            messages.error(request, "Unauthorized payment return request.")
            # NEVER leak the checkout_token or redirect to order_status on unauthorized access!
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
            # Ensure authorized session is set so order_status can be viewed without token in URL
            request.session[f"order_token_{order.receipt_number}"] = order.checkout_token
        except Exception as exc:
            logger.exception("PayPal capture failed for order %s: %s", order.receipt_number, exc)
            messages.error(request, "PayPal payment capture encountered an issue. Our team has been notified.")

        # Redirect cleanly using session-based authorization (NO token in query string)
        return redirect(reverse("storefront:order_status", kwargs={"receipt_number": order.receipt_number}))


class OrderStatusView(View):
    """
    Displays the live status of an order, M-Pesa PIN prompt modal or Till fallback instructions.
    """
    def get(self, request, receipt_number):
        order = (
            Order.objects.select_related("coupon")
            .prefetch_related("items__product")
            .filter(receipt_number__iexact=receipt_number)
            .first()
        )
        if not order and receipt_number.isdigit():
            order = (
                Order.objects.select_related("coupon")
                .prefetch_related("items__product")
                .filter(pk=int(receipt_number))
                .first()
            )
        if not order:
            raise Http404("Order not found")

        if not authorize_order_access(request, order):
            return render(
                request,
                "storefront/order_verify.html",
                {"order": order, "receipt_number": receipt_number},
            )

        payment = Payment.objects.filter(order=order).order_by("-created_at").first()

        state = customer_payment_state(order, payment)

        context = {
            "order": order,
            "items": order.items.all(),
            "payment": payment,
            "payment_state": state,
            "is_paid": state == "confirmed",
            "show_till_instructions": state == "manual",
            "till_number": BUY_GOODS_TILL_NUMBER,
            "whatsapp_order_link": (
                f"https://wa.me/254726771321?text=Hello%20Malaika%20Nest%2C%20I%20am%20inquiring%20about%20Order%20{order.receipt_number}"
            ),
        }
        response = render(request, "storefront/order_status.html", context)
        add_never_cache_headers(response)
        return response

    def post(self, request, receipt_number):
        order = Order.objects.filter(receipt_number__iexact=receipt_number).first()
        if not order and receipt_number.isdigit():
            order = Order.objects.filter(pk=int(receipt_number)).first()
        if not order:
            raise Http404("Order not found")
        if authorize_order_access(request, order):
            # Session is authorized; redirect without exposing secret token in query string
            return redirect(reverse("storefront:order_status", kwargs={"receipt_number": order.receipt_number}))
        return render(
            request,
            "storefront/order_verify.html",
            {
                "order": order,
                "receipt_number": receipt_number,
                "verify_error": "The phone number or email entered did not match this order. Please check the details and try again.",
            },
            status=403,
        )


class OrderLookupView(View):
    """
    Public order tracking lookup. Customers can enter their receipt number
    and phone/email to look up an order from mobile or desktop.
    Includes rate-limiting (throttling) and uniform error responses to prevent enumeration.
    """
    def get(self, request):
        return render(request, "storefront/order_lookup.html")

    def post(self, request):
        from apps.core.utils import get_client_ip
        from django.core.cache import cache

        client_ip = get_client_ip(request)
        throttle_key = f"order_lookup_throttle_{client_ip}"
        attempts = cache.get(throttle_key, 0)
        if attempts >= 8:
            messages.error(request, "Too many lookup attempts. Please wait a moment before trying again.")
            return render(request, "storefront/order_lookup.html", status=429)

        cache.set(throttle_key, attempts + 1, timeout=60)

        order_ref = request.POST.get("order_ref", "").strip().upper()
        contact = request.POST.get("contact", "").strip()

        if not order_ref or not contact:
            messages.error(request, "Please enter both your Order / Receipt number and your phone or email.")
            return render(request, "storefront/order_lookup.html", {"order_ref": order_ref, "contact": contact})

        if order_ref.isdigit():
            order = Order.objects.filter(pk=int(order_ref)).first()
        else:
            order = Order.objects.filter(receipt_number__iexact=order_ref).first()

        is_match = False
        if order:
            phone_digits = re.sub(r"[^\d]", "", contact)
            order_phone = re.sub(r"[^\d]", "", (order.shipping_phone or getattr(order, "guest_phone", "") or ""))
            guest_email = (getattr(order, "guest_email", "") or "").lower()
            user_email = (getattr(order.user, "email", "") or "").lower() if order.user else ""

            if contact.lower() in (guest_email, user_email):
                is_match = True
            elif phone_digits and len(phone_digits) >= 9 and phone_digits[-9:] in order_phone:
                is_match = True
            elif request.user.is_staff or (request.user.is_authenticated and order.user == request.user):
                is_match = True

        if is_match and order:
            # Grant access via secure session cache; do NOT expose token in query string
            request.session[f"order_token_{order.receipt_number}"] = order.checkout_token
            return redirect(reverse("storefront:order_status", kwargs={"receipt_number": order.receipt_number}))

        # Uniform error message: prevents receipt enumeration by returning the same error whether
        # the order reference does not exist or the contact does not match
        messages.error(
            request,
            "No matching order found with the provided details. Please verify your order reference and the phone number or email used during checkout."
        )
        return render(request, "storefront/order_lookup.html", {"order_ref": order_ref, "contact": contact})


def customer_payment_state(order, payment):
    if order.status in {"paid", "processing", "shipped", "delivered"}:
        return "confirmed"
    if order.status in {"cancelled", "refunded"}:
        return "closed"
    if payment and payment.payment_method == "mpesa":
        if payment.mpesa_issue in {"initiation_unknown", "intent_mismatch", "duplicate_receipt", "query_attempts_exhausted"}:
            return "review"
        if payment.checkout_request_id and payment.status in {"failed", "cancelled"}:
            return payment.status
        if payment.checkout_request_id:
            return "pending"
    return "manual"


class OrderStatusPollView(View):
    def get(self, request, receipt_number):
        order = Order.objects.filter(receipt_number=receipt_number).first()
        session_token = request.session.get(f"order_token_{receipt_number}")
        if not order or not (
            (request.user.is_authenticated and (request.user.is_staff or order.user_id == request.user.pk))
            or (session_token and session_token == order.checkout_token)
        ):
            return JsonResponse({"error": "Order not found"}, status=404)
        payment = Payment.objects.filter(order=order).first()
        state = customer_payment_state(order, payment)
        response = JsonResponse({
            "receipt_number": order.receipt_number,
            "status": order.status,
            "status_display": order.get_status_display(),
            "payment_state": state,
            "is_paid": state == "confirmed",
            "mpesa_receipt": order.mpesa_receipt_number or (payment.mpesa_receipt_number if payment else ""),
        })
        add_never_cache_headers(response)
        return response
