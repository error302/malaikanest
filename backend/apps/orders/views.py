from rest_framework import viewsets, permissions, status, pagination
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from apps.accounts.models import User
from apps.products.models import Inventory, Product, ProductVariant, VariantInventory
from .models import Cart, CartItem, Order, OrderItem, Coupon, DeliveryZone
from .serializers import (
    CartSerializer,
    OrderSerializer,
    CouponSerializer,
    DeliveryZoneSerializer,
)


class OrderPagination(pagination.PageNumberPagination):
    """MED-05: Paginate all order lists to prevent memory exhaustion on large datasets."""

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class CartViewSet(viewsets.ViewSet):
    """
    Cart API - allows both authenticated and guest users.
    Guest users are identified by session.
    """

    permission_classes = [permissions.AllowAny]

    def _get_prefetched_cart(self, cart_id):
        return Cart.objects.select_related("coupon").prefetch_related(
            "items__product__category",
            "items__product__brand",
            "items__product__tags",
            "items__variant__inventory",
        ).get(id=cart_id)

    def _get_locked_inventory(self, product_id):
        product = (
            Product.objects.select_for_update()
            .filter(pk=product_id, is_active=True)
            .first()
        )
        if not product:
            raise Product.DoesNotExist

        inventory, _ = Inventory.objects.select_for_update().get_or_create(
            product=product,
            defaults={"quantity": product.stock},
        )
        return inventory

    def _get_locked_variant_inventory(self, variant_id):
        variant = (
            ProductVariant.objects.select_for_update()
            .select_related("product")
            .filter(pk=variant_id, is_active=True)
            .first()
        )
        if not variant:
            raise ProductVariant.DoesNotExist

        inventory, _ = VariantInventory.objects.select_for_update().get_or_create(
            variant=variant,
            defaults={"quantity": 0},
        )
        return inventory

    def list(self, request):
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            cart = self._get_or_create_guest_cart(request)
        cart = self._get_prefetched_cart(cart.id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def _get_or_create_guest_cart(self, request):
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key
        cart, _ = Cart.objects.get_or_create(session_key=session_key, user=None)
        return cart

    @action(detail=False, methods=["post"])
    def add(self, request):
        product_id = request.data.get("product_id")
        variant_id = request.data.get("variant_id")
        try:
            qty = int(request.data.get("quantity", 1))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be an integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if qty < 1:
            return Response(
                {"detail": "Quantity must be at least 1"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # New locked implementation (kept early-return to avoid legacy code path).
        try:
            with transaction.atomic():
                variant = None
                if variant_id:
                    inv = self._get_locked_variant_inventory(variant_id)
                    variant = inv.variant
                    if product_id and int(product_id) != variant.product_id:
                        return Response(
                            {"detail": "Selected color does not belong to this product"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    product_id = variant.product_id
                else:
                    inv = self._get_locked_inventory(product_id)

                if request.user.is_authenticated:
                    cart, _ = Cart.objects.get_or_create(user=request.user)
                else:
                    cart = self._get_or_create_guest_cart(request)

                cart = Cart.objects.select_for_update().get(pk=cart.pk)

                ci_query = CartItem.objects.select_for_update().filter(cart=cart)
                ci = ci_query.filter(variant=variant).first() if variant else ci_query.filter(product_id=product_id, variant__isnull=True).first()
                desired_qty = qty if not ci else (ci.quantity + qty)

                if inv.available() < desired_qty:
                    return Response(
                        {"detail": f"Only {inv.available()} items available in stock"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if ci:
                    ci.quantity = desired_qty
                    if not ci.unit_price:
                        ci.unit_price = (
                            variant.product.price + variant.price_modifier
                            if variant
                            else inv.product.price
                        )
                    ci.save(update_fields=["quantity", "unit_price", "updated_at"])
                else:
                    CartItem.objects.create(
                        cart=cart,
                        product=variant.product if variant else inv.product,
                        variant=variant,
                        quantity=qty,
                        unit_price=(
                            variant.product.price + variant.price_modifier
                            if variant
                            else inv.product.price
                        ),
                    )

            cart = self._get_prefetched_cart(cart.id)
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except (Inventory.DoesNotExist, Product.DoesNotExist, ProductVariant.DoesNotExist, VariantInventory.DoesNotExist):
            return Response(
                {"detail": "Product not found or out of stock"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["post"])
    def apply_coupon(self, request):
        code = (request.data.get("code") or request.data.get("coupon") or "").strip().upper()
        if not code:
            return Response({"detail": "Coupon code is required"}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            cart = self._get_or_create_guest_cart(request)

        with transaction.atomic():
            cart = Cart.objects.select_for_update().get(pk=cart.pk)
            coupon = Coupon.objects.select_for_update().filter(code=code, is_active=True).first()
            if not coupon:
                return Response({"detail": "Invalid coupon code"}, status=status.HTTP_400_BAD_REQUEST)

            subtotal = cart.subtotal_amount()
            if not coupon.is_valid():
                return Response({"detail": "Coupon is expired or inactive"}, status=status.HTTP_400_BAD_REQUEST)
            if coupon.min_order_value and subtotal < coupon.min_order_value:
                return Response(
                    {"detail": f"Minimum order value is KES {coupon.min_order_value}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Idempotent: do nothing if already applied.
            if cart.coupon_id == coupon.id:
                cart = self._get_prefetched_cart(cart.id)
                return Response(CartSerializer(cart).data)

            if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
                return Response({"detail": "Coupon usage limit reached"}, status=status.HTTP_400_BAD_REQUEST)

            cart.coupon = coupon
            cart.coupon_applied_at = timezone.now()
            cart.save(update_fields=["coupon", "coupon_applied_at", "updated_at"])

        cart = self._get_prefetched_cart(cart.id)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["post"])
    def remove_coupon(self, request):
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            cart = self._get_or_create_guest_cart(request)

        with transaction.atomic():
            cart = Cart.objects.select_for_update().get(pk=cart.pk)
            cart.coupon = None
            cart.coupon_applied_at = None
            cart.save(update_fields=["coupon", "coupon_applied_at", "updated_at"])

        cart = self._get_prefetched_cart(cart.id)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["post"])
    def checkout(self, request):
        from .services import OrderService

        is_guest = request.data.get("is_guest", False)
        guest_email = request.data.get("guest_email")
        guest_phone = request.data.get("guest_phone")
        coupon_code = request.data.get("coupon")
        delivery_region = request.data.get("delivery_region", "nairobi")
        
        is_gift = request.data.get("is_gift", False)
        gift_message = request.data.get("gift_message", "")
        
        shipping_name = request.data.get("shipping_name", "")
        shipping_phone = request.data.get("shipping_phone", "")
        shipping_address = request.data.get("shipping_address", "")
        shipping_city = request.data.get("shipping_city", "")
        shipping_county = request.data.get("shipping_county", "")
        shipping_postal_code = request.data.get("shipping_postal_code", "")
        notes = request.data.get("notes", "")

        coupon = None
        if coupon_code:
            coupon = Coupon.objects.filter(code=str(coupon_code).strip().upper(), is_active=True).first()
            if not coupon:
                return Response({"detail": "Invalid coupon code"}, status=status.HTTP_400_BAD_REQUEST)
            if coupon and not coupon.is_valid():
                return Response({"detail": "Coupon is expired or inactive"}, status=status.HTTP_400_BAD_REQUEST)

        if is_guest and guest_email:
            session_key = request.session.session_key
            if not session_key:
                request.session.create()
                session_key = request.session.session_key
            cart = get_object_or_404(Cart, session_key=session_key, user=None)
            # Use coupon stored on the cart if present.
            coupon = coupon or cart.coupon
            if coupon and not coupon.is_valid():
                return Response({"detail": "Coupon is expired or inactive"}, status=status.HTTP_400_BAD_REQUEST)

            # Persist delivery region on cart for consistent totals in responses.
            Cart.objects.filter(pk=cart.pk).update(delivery_region=delivery_region)

            user = None
            try:
                user = User.objects.get(email=guest_email)
            except User.DoesNotExist:
                pass

            try:
                order = OrderService.process_checkout(
                    cart=cart,
                    user=user,
                    guest_email=guest_email,
                    guest_phone=guest_phone,
                    coupon=coupon,
                    delivery_region=delivery_region,
                    is_gift=is_gift,
                    gift_message=gift_message,
                    shipping_name=shipping_name,
                    shipping_phone=shipping_phone,
                    shipping_address=shipping_address,
                    shipping_city=shipping_city,
                    shipping_county=shipping_county,
                    shipping_postal_code=shipping_postal_code,
                    notes=notes,
                )
            except ValueError as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            serializer = OrderSerializer(order)
            return Response(
                {**serializer.data, "is_guest": True, "guest_checkout": True}
            )

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        cart = get_object_or_404(Cart, user=request.user)
        coupon = coupon or cart.coupon
        if coupon and not coupon.is_valid():
            return Response({"detail": "Coupon is expired or inactive"}, status=status.HTTP_400_BAD_REQUEST)
        Cart.objects.filter(pk=cart.pk).update(delivery_region=delivery_region)
        try:
            order = OrderService.process_checkout(
                cart=cart,
                user=request.user,
                coupon=coupon,
                delivery_region=delivery_region,
                is_gift=is_gift,
                gift_message=gift_message,
                shipping_name=shipping_name,
                shipping_phone=shipping_phone,
                shipping_address=shipping_address,
                shipping_city=shipping_city,
                shipping_county=shipping_county,
                shipping_postal_code=shipping_postal_code,
                notes=notes,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderSerializer(order)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="remove/(?P<product_id>[^/.]+)")
    def remove(self, request, product_id=None):
        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
        else:
            session_key = request.session.session_key
            if not session_key:
                return Response(
                    {"detail": "No cart found"}, status=status.HTTP_400_BAD_REQUEST
                )
            cart = get_object_or_404(Cart, session_key=session_key, user=None)

        variant_id = request.data.get("variant_id")
        if variant_id:
            CartItem.objects.filter(cart=cart, variant_id=variant_id).delete()
        else:
            CartItem.objects.filter(cart=cart, product_id=product_id, variant__isnull=True).delete()
        cart = self._get_prefetched_cart(cart.id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def update_item(self, request):
        """Update quantity of a cart item"""
        product_id = request.data.get("product_id")
        variant_id = request.data.get("variant_id")
        try:
            quantity = int(request.data.get("quantity", 1))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be an integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantity < 1:
            return Response(
                {"detail": "Quantity must be at least 1"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Locked implementation to prevent race conditions.
        try:
            with transaction.atomic():
                variant = None
                if variant_id:
                    inv = self._get_locked_variant_inventory(variant_id)
                    variant = inv.variant
                    product_id = variant.product_id
                else:
                    inv = self._get_locked_inventory(product_id)
                if inv.available() < quantity:
                    return Response(
                        {"detail": f"Only {inv.available()} items available in stock"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if request.user.is_authenticated:
                    cart = get_object_or_404(Cart.objects.select_for_update(), user=request.user)
                else:
                    session_key = request.session.session_key
                    if not session_key:
                        return Response(
                            {"detail": "No cart found"}, status=status.HTTP_400_BAD_REQUEST
                        )
                    cart = get_object_or_404(
                        Cart.objects.select_for_update(), session_key=session_key, user=None
                    )

                cart_item_query = CartItem.objects.select_for_update().filter(cart=cart)
                cart_item = cart_item_query.filter(variant=variant).first() if variant else cart_item_query.filter(product_id=product_id, variant__isnull=True).first()
                if not cart_item:
                    return Response(
                        {"detail": "Item not found in cart"}, status=status.HTTP_404_NOT_FOUND
                    )

                cart_item.quantity = quantity
                if not cart_item.unit_price:
                    cart_item.unit_price = (
                        cart_item.product.price + cart_item.variant.price_modifier
                        if cart_item.variant
                        else cart_item.product.price
                    )
                cart_item.save(update_fields=["quantity", "unit_price", "updated_at"])

            cart = self._get_prefetched_cart(cart.id)
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except (Inventory.DoesNotExist, Product.DoesNotExist, ProductVariant.DoesNotExist, VariantInventory.DoesNotExist):
            return Response(
                {"detail": "Product not found or out of stock"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def clear_cart(self, request):
        """Clear all items from the cart."""
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            session_key = request.session.session_key
            if not session_key:
                request.session.create()
                session_key = request.session.session_key
            cart, _ = Cart.objects.get_or_create(session_key=session_key, user=None)

        with transaction.atomic():
            cart = Cart.objects.select_for_update().get(pk=cart.pk)
            CartItem.objects.filter(cart=cart).delete()
            cart.coupon = None
            cart.coupon_applied_at = None
            cart.save(update_fields=["coupon", "coupon_applied_at", "updated_at"])
        cart = self._get_prefetched_cart(cart.id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="merge", permission_classes=[permissions.IsAuthenticated])
    def merge(self, request):
        """
        BUG-CART-01: Merge guest cart into user cart on login.
        Combines quantities for same products.
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        session_key = (request.data.get("session_key") or request.session.session_key or "").strip()
        if not session_key:
            request.session.create()
            session_key = request.session.session_key or ""

        if not session_key:
            return Response({"detail": "No guest session found"}, status=status.HTTP_400_BAD_REQUEST)

        guest_cart = Cart.objects.filter(session_key=session_key, user=None).first()
        if not guest_cart:
            user_cart, _ = Cart.objects.get_or_create(user=request.user)
            cart = self._get_prefetched_cart(user_cart.id)
            return Response(CartSerializer(cart).data)

        user_cart, _ = Cart.objects.get_or_create(user=request.user)

        with transaction.atomic():
            for item in guest_cart.items.all():
                if item.variant_id:
                    defaults = {
                        "product": item.product,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price or (item.product.price + item.variant.price_modifier),
                    }
                else:
                    defaults = {
                        "quantity": item.quantity,
                        "unit_price": item.unit_price or item.product.price,
                    }

                user_item = (
                    CartItem.objects.select_for_update()
                    .filter(cart=user_cart, variant=item.variant)
                    .first()
                    if item.variant_id
                    else CartItem.objects.select_for_update()
                    .filter(cart=user_cart, product=item.product, variant__isnull=True)
                    .first()
                )
                created = user_item is None
                if created:
                    user_item = CartItem.objects.create(
                        cart=user_cart,
                        product=item.product,
                        variant=item.variant,
                        quantity=item.quantity,
                        unit_price=defaults["unit_price"],
                    )
                if not created:
                    try:
                        if item.variant_id:
                            inv = VariantInventory.objects.get(variant=item.variant)
                        else:
                            inv = Inventory.objects.get(product=item.product)
                        max_qty = inv.available()
                        user_item.quantity = min(user_item.quantity + item.quantity, max_qty)
                    except (Inventory.DoesNotExist, VariantInventory.DoesNotExist):
                        user_item.quantity += item.quantity
                    if not user_item.unit_price:
                        user_item.unit_price = defaults["unit_price"]
                    user_item.save()
            guest_cart.delete()

        cart = self._get_prefetched_cart(user_cart.id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    # MED-05: Added pagination to prevent memory exhaustion on large datasets
    pagination_class = OrderPagination

    def get_queryset(self):
        user = self.request.user
        status_filter = self.request.query_params.get("status")

        # Admin users can see all orders
        if user.is_staff or getattr(user, "role", None) == User.ROLE_ADMIN:
            qs = (
                Order.objects.all()
                .select_related("user")
                .prefetch_related("items__product")
            )
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs

        # Regular users can only see their own orders
        qs = (
            Order.objects.filter(user=user)
            .select_related("user")
            .prefetch_related("items__product")
        )
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_object(self):
        """Override to add row-level security check."""
        obj = super().get_object()
        user = self.request.user

        if user.is_staff or getattr(user, "role", None) == User.ROLE_ADMIN:
            return obj

        if obj.user != user:
            # M3 fix: viewing a guest order requires the per-order checkout_token,
            # not just an email match. The order id is sequential and guessable, and
            # the guest email leaks via the receipt email, so email alone lets any
            # logged-in user enumerate every guest order matching their address.
            provided_token = (
                self.request.data.get("checkout_token")
                or self.request.query_params.get("checkout_token")
                or ""
            ).strip()
            if not obj.guest_email or obj.guest_email.lower() != (user.email or "").lower():
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("You do not have permission to view this order")
            if obj.checkout_token and provided_token != obj.checkout_token:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("checkout_token required to view this guest order")

        return obj

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        from .services import OrderService

        order = self.get_object()

        try:
            OrderService.cancel_order(order)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "cancelled"})

    @action(detail=True, methods=["post"])
    def retry_payment(self, request, pk=None):
        """
        MED-02: Allow customers to retry payment after payment_failed status.
        Resets order to pending so a new payment can be initiated.
        """
        from .services import OrderService

        order = self.get_object()

        try:
            OrderService.retry_payment(order)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "detail": "Order reset to pending. You can now retry payment.",
                "order_id": order.id,
            }
        )

    @action(detail=True, methods=["get"])
    def invoice(self, request, pk=None):
        """
        Get invoice for an order.
        Returns the invoice PDF or generates one if not exists.
        
        FIXED: Handles both local file storage and Cloudinary URLs.
        """
        from .invoice import generate_invoice_pdf, get_invoice_pdf_url
        from django.http import HttpResponse, FileResponse
        import requests

        order = self.get_object()

        try:
            invoice = order.invoice
        except Order.invoice.RelatedObjectDoesNotExist:
            pdf_result, invoice_number = generate_invoice_pdf(order)
            if pdf_result:
                return HttpResponse(pdf_result, content_type="application/pdf")
            else:
                return Response(
                    {"detail": "Failed to generate invoice"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        if invoice.pdf_file:
            pdf_url = None
            raw_url = None

            if hasattr(invoice.pdf_file, 'url'):
                raw_url = invoice.pdf_file.url
            elif isinstance(invoice.pdf_file, str):
                raw_url = invoice.pdf_file

            # Only fetch remote URLs; relative media paths fall through to local
            # file serving below (and avoid SSRF / internal network access).
            if raw_url and raw_url.startswith(('http://', 'https://')):
                pdf_url = raw_url

            if pdf_url:
                from urllib.parse import urlparse

                parsed = urlparse(pdf_url)
                allowed_hosts = getattr(
                    settings,
                    "INVOICE_URL_ALLOWED_HOSTS",
                    ["res.cloudinary.com", "cloudinary.com"],
                )
                # SSRF guard: only fetch over HTTPS from an allow-listed host
                # (Cloudinary). Never fetch arbitrary/admin-supplied URLs.
                if parsed.scheme == "https" and parsed.hostname and parsed.hostname.lower() in allowed_hosts:
                    try:
                        remote_response = requests.get(pdf_url, timeout=30)
                        if remote_response.status_code == 200:
                            pdf_content = remote_response.content
                            invoice.download_count += 1
                            invoice.save(update_fields=["download_count"])
                            response = HttpResponse(pdf_content, content_type="application/pdf")
                            response["Content-Disposition"] = (
                                f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
                            )
                            return response
                    except requests.RequestException as e:
                        logger.error("Error fetching invoice from URL: %s", e)
                        return Response(
                            {"detail": "Failed to retrieve invoice"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        )
            
            try:
                invoice.download_count += 1
                invoice.save(update_fields=["download_count"])
                
                if hasattr(invoice.pdf_file, 'open'):
                    invoice.pdf_file.open('rb')
                    return FileResponse(invoice.pdf_file, content_type="application/pdf")
                else:
                    pdf_path = invoice.pdf_file.path
                    return FileResponse(open(pdf_path, 'rb'), content_type="application/pdf")
            except Exception as e:
                logger.error("Error serving invoice file: %s", e)
                return Response(
                    {"detail": "Failed to retrieve invoice"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        pdf_result, invoice_number = generate_invoice_pdf(order, invoice.invoice_number)
        if pdf_result:
            response = HttpResponse(pdf_result, content_type="application/pdf")
            response["Content-Disposition"] = (
                f'attachment; filename="invoice_{invoice_number}.pdf"'
            )
            return response

        return Response(
            {"detail": "Invoice not available"}, status=status.HTTP_404_NOT_FOUND
        )


class GuestOrderTrackView(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        checkout_token = (request.data.get("checkout_token") or "").strip()
        receipt_number = (request.data.get("receipt_number") or "").strip()
        email = (request.data.get("email") or "").strip().lower()

        if checkout_token:
            order = (
                Order.objects.select_related("user")
                .prefetch_related("items__product")
                .filter(checkout_token=checkout_token, user__isnull=True)
                .first()
            )
            if not order:
                return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response(OrderSerializer(order).data)

        if receipt_number and email:
            order = (
                Order.objects.select_related("user")
                .prefetch_related("items__product")
                .filter(receipt_number=receipt_number, user__email=email)
                .first()
            )
            if not order:
                return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response(OrderSerializer(order).data)

        return Response(
            {"detail": "Please provide either checkout_token or receipt_number + email"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class DeliveryZonesView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        zones = DeliveryZone.objects.filter(is_active=True)
        serializer = DeliveryZoneSerializer(zones, many=True)
        return Response(serializer.data)
