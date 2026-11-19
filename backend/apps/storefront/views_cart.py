import logging
from decimal import Decimal

from django.contrib import messages
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views import View

from apps.orders.models import Cart, CartItem, Coupon, get_delivery_fee_for_region
from apps.products.models import Inventory, Product, ProductVariant, VariantInventory

logger = logging.getLogger(__name__)

FREE_SHIPPING_THRESHOLD = Decimal("10000.00")
PUBLIC_STATUS = "published"


def get_free_shipping_threshold() -> Decimal:
    try:
        from apps.core.models import SiteSettings
        return SiteSettings.get_free_shipping_threshold()
    except Exception:
        return FREE_SHIPPING_THRESHOLD


def get_or_create_cart(request) -> Cart:
    """
    Retrieves or creates a Cart for the current request.
    Works for both authenticated users and anonymous guest visitors.
    Merges any guest items into the user's cart if the user has authenticated.
    """
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        session_key = request.session.session_key
        if session_key:
            guest_cart = Cart.objects.filter(session_key=session_key, user__isnull=True).exclude(pk=cart.pk).first()
            if guest_cart:
                for item in guest_cart.items.all():
                    existing = cart.items.filter(product=item.product, variant=item.variant).first()
                    if existing:
                        existing.quantity += item.quantity
                        existing.save()
                    else:
                        item.cart = cart
                        item.save()
                guest_cart.delete()
        return cart

    session_key = request.session.session_key
    if not session_key:
        request.session.create()
        session_key = request.session.session_key
    cart, _ = Cart.objects.get_or_create(session_key=session_key, user=None)
    return cart


class CartView(View):
    """
    Renders the guest / user cart page with items, delivery estimate, and live coupon support.
    """
    def get(self, request):
        cart = get_or_create_cart(request)
        items = cart.items.select_related("product", "product__category", "variant").all()

        # Update delivery region if provided via query param
        region_param = request.GET.get("region")
        if region_param in ["mombasa_pickup", "mombasa", "nairobi", "upcountry"]:
            if cart.delivery_region != region_param:
                cart.delivery_region = region_param
                cart.save(update_fields=["delivery_region"])

        subtotal = cart.subtotal_amount()
        discount = cart.discount_amount()
        free_shipping_threshold = get_free_shipping_threshold()

        # Free shipping if subtotal >= free_shipping_threshold
        if subtotal >= free_shipping_threshold and subtotal > 0:
            delivery_fee = Decimal("0.00")
            free_shipping_qualified = True
            free_shipping_remaining = Decimal("0.00")
        else:
            delivery_fee = get_delivery_fee_for_region(cart.delivery_region)
            free_shipping_qualified = False
            free_shipping_remaining = max(Decimal("0.00"), free_shipping_threshold - subtotal)

        total = max(Decimal("0.00"), subtotal - discount) + delivery_fee

        context = {
            "cart": cart,
            "items": items,
            "subtotal": subtotal,
            "discount": discount,
            "delivery_fee": delivery_fee,
            "total": total,
            "free_shipping_threshold": free_shipping_threshold,
            "free_shipping_qualified": free_shipping_qualified,
            "free_shipping_remaining": free_shipping_remaining,
        }
        return render(request, "storefront/cart.html", context)


class AddToCartView(View):
    """
    Atomically adds a product or variant to the session/user cart with stock checks.
    """
    def post(self, request):
        product_id = request.POST.get("product_id")
        variant_id = request.POST.get("variant_id") or None
        redirect_url = request.POST.get("next") or request.META.get("HTTP_REFERER") or reverse("storefront:cart")

        try:
            quantity = int(request.POST.get("quantity", 1))
            if quantity < 1:
                messages.error(request, "Quantity must be at least 1.")
                return redirect(redirect_url)
        except (ValueError, TypeError):
            messages.error(request, "Invalid quantity.")
            return redirect(redirect_url)

        with transaction.atomic():
            # Validate product exists, is active and published
            product = Product.objects.select_for_update().filter(
                pk=product_id, is_active=True, status=PUBLIC_STATUS
            ).first()
            if not product:
                messages.error(request, "Product is not available.")
                return redirect(redirect_url)

            has_variants = ProductVariant.objects.filter(product=product).exists()
            variant = None
            if variant_id:
                variant = ProductVariant.objects.select_for_update().select_related("product").filter(
                    pk=variant_id, product=product, is_active=True
                ).first()
                if not variant:
                    messages.error(request, "Selected variant is not available.")
                    return redirect(redirect_url)
            elif has_variants:
                messages.error(request, "Please choose a size or option for this item.")
                return redirect(redirect_url)

            # Determine available stock (variant stock never falls back to parent)
            if variant:
                var_inv = VariantInventory.objects.select_for_update().filter(variant=variant).first()
                available_stock = var_inv.available() if var_inv else 0
                unit_price = product.price + (variant.price_modifier or Decimal("0.00"))
            else:
                inv, _ = Inventory.objects.select_for_update().get_or_create(
                    product=product, defaults={"quantity": product.stock}
                )
                available_stock = inv.available()
                unit_price = product.price

            cart = get_or_create_cart(request)
            cart = Cart.objects.select_for_update().get(pk=cart.pk)

            # Find existing CartItem if any
            if variant:
                cart_item = CartItem.objects.select_for_update().filter(cart=cart, variant=variant).first()
            else:
                cart_item = CartItem.objects.select_for_update().filter(cart=cart, product=product, variant__isnull=True).first()

            current_qty = cart_item.quantity if cart_item else 0
            new_qty = current_qty + quantity

            if available_stock < new_qty:
                messages.error(
                    request,
                    f"Only {available_stock} item(s) available in stock for '{product.name}'."
                )
                return redirect(redirect_url)

            if cart_item:
                cart_item.quantity = new_qty
                cart_item.unit_price = unit_price
                cart_item.save(update_fields=["quantity", "unit_price", "updated_at"])
            else:
                CartItem.objects.create(
                    cart=cart,
                    product=product,
                    variant=variant,
                    quantity=quantity,
                    unit_price=unit_price,
                )

            messages.success(request, f"Added {product.name} to your bag.")

        return redirect(reverse("storefront:cart"))


class UpdateCartItemView(View):
    """
    Updates the quantity of a cart item or removes it if quantity <= 0.
    """
    def post(self, request):
        item_id = request.POST.get("item_id")
        try:
            quantity = int(request.POST.get("quantity", 1))
        except (ValueError, TypeError):
            messages.error(request, "Invalid quantity.")
            return redirect("storefront:cart")

        cart = get_or_create_cart(request)

        with transaction.atomic():
            cart_item = CartItem.objects.select_for_update().filter(
                pk=item_id, cart=cart
            ).first()

            if not cart_item:
                messages.error(request, "Cart item not found.")
                return redirect("storefront:cart")

            if quantity <= 0:
                cart_item.delete()
                messages.info(request, f"Removed {cart_item.product.name} from your cart.")
                return redirect("storefront:cart")

            product = cart_item.product
            if not (product.is_active and product.status == PUBLIC_STATUS):
                messages.error(request, "This item is no longer available.")
                return redirect("storefront:cart")

            has_variants = ProductVariant.objects.filter(product=product).exists()
            if has_variants and not cart_item.variant:
                messages.error(request, "Please choose a size or option for this item.")
                return redirect("storefront:cart")

            # Check stock (variant stock never falls back to parent)
            if cart_item.variant:
                if not cart_item.variant.is_active:
                    messages.error(request, "Selected size is no longer available.")
                    return redirect("storefront:cart")
                var_inv = VariantInventory.objects.filter(variant=cart_item.variant).first()
                available = var_inv.available() if var_inv else 0
            else:
                inv = Inventory.objects.filter(product=product).first()
                available = inv.available() if inv else product.stock

            if available < quantity:
                messages.error(request, f"Only {available} available in stock.")
                return redirect("storefront:cart")

            cart_item.quantity = quantity
            cart_item.save(update_fields=["quantity", "updated_at"])
            messages.success(request, "Cart updated.")

        return redirect("storefront:cart")


class RemoveCartItemView(View):
    """
    Removes an item from the cart.
    """
    def post(self, request):
        item_id = request.POST.get("item_id")
        cart = get_or_create_cart(request)
        cart_item = CartItem.objects.filter(pk=item_id, cart=cart).first()
        if cart_item:
            product_name = cart_item.product.name
            cart_item.delete()
            messages.info(request, f"Removed {product_name} from your cart.")
        return redirect("storefront:cart")


class ApplyCouponView(View):
    """
    Applies a coupon to the current cart.
    """
    def post(self, request):
        code = request.POST.get("code", "").strip().upper()
        if not code:
            messages.error(request, "Please enter a coupon code.")
            return redirect("storefront:cart")

        cart = get_or_create_cart(request)
        coupon = Coupon.objects.filter(code=code, is_active=True).first()

        if not coupon or not coupon.is_valid():
            messages.error(request, f"Coupon code '{code}' is invalid or expired.")
            return redirect("storefront:cart")

        subtotal = cart.subtotal_amount()
        if coupon.min_order_value and subtotal < coupon.min_order_value:
            messages.error(
                request,
                f"Coupon requires a minimum order of KES {coupon.min_order_value|floatformat:0}."
            )
            return redirect("storefront:cart")

        cart.coupon = coupon
        cart.coupon_applied_at = timezone.now()
        cart.save(update_fields=["coupon", "coupon_applied_at"])
        messages.success(request, f"Coupon '{code}' applied successfully!")
        return redirect("storefront:cart")


class RemoveCouponView(View):
    """
    Removes the coupon from the current cart.
    """
    def post(self, request):
        cart = get_or_create_cart(request)
        if cart.coupon:
            cart.coupon = None
            cart.coupon_applied_at = None
            cart.save(update_fields=["coupon", "coupon_applied_at"])
            messages.info(request, "Coupon removed.")
        return redirect("storefront:cart")


class UpdateDeliveryRegionView(View):
    """
    Updates the delivery region for the cart.
    """
    def post(self, request):
        region = request.POST.get("delivery_region", "nairobi")
        if region in ["mombasa_pickup", "mombasa", "nairobi", "upcountry"]:
            cart = get_or_create_cart(request)
            cart.delivery_region = region
            cart.save(update_fields=["delivery_region"])
            messages.success(request, f"Delivery region updated to {cart.get_delivery_region_display()}.")
        return redirect("storefront:cart")
