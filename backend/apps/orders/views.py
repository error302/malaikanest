from rest_framework import viewsets, permissions, status, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import F
from django.utils.crypto import get_random_string
from apps.accounts.models import User
from apps.products.models import Inventory
from .models import Cart, CartItem, Order, OrderItem, Coupon, create_order_from_cart
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    OrderSerializer,
    CouponSerializer,
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
        return Cart.objects.prefetch_related(
            "items__product__category", "items__product__brand"
        ).get(id=cart_id)

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
        qty = int(request.data.get("quantity", 1))

        if qty < 1:
            return Response(
                {"detail": "Quantity must be at least 1"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # MED-06: Validate stock before adding to cart
        try:
            inv = Inventory.objects.get(product_id=product_id)
            if inv.available() < qty:
                return Response(
                    {"detail": f"Only {inv.available()} items available in stock"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Inventory.DoesNotExist:
            return Response(
                {"detail": "Product not found or out of stock"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            cart = self._get_or_create_guest_cart(request)

        ci, created = CartItem.objects.get_or_create(
            cart=cart, product_id=product_id, defaults={"quantity": qty}
        )
        if not created:
            # Validate total qty against available stock
            new_qty = ci.quantity + qty
            inv = Inventory.objects.get(product_id=product_id)
            if inv.available() < new_qty:
                return Response(
                    {
                        "detail": f"Cannot add {qty} more — only {inv.available()} available"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ci.quantity = new_qty
            ci.save()
        cart = self._get_prefetched_cart(cart.id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def checkout(self, request):
        from .services import OrderService

        is_guest = request.data.get("is_guest", False)
        guest_email = request.data.get("guest_email")
        guest_phone = request.data.get("guest_phone")
        coupon_code = request.data.get("coupon")
        delivery_region = request.data.get("delivery_region", "nairobi")

        coupon = None
        if coupon_code:
            coupon = get_object_or_404(Coupon, code=coupon_code, active=True)

        if is_guest and guest_email:
            session_key = request.session.session_key
            if not session_key:
                request.session.create()
                session_key = request.session.session_key
            cart = get_object_or_404(Cart, session_key=session_key, user=None)

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
        try:
            order = OrderService.process_checkout(
                cart=cart,
                user=request.user,
                coupon=coupon,
                delivery_region=delivery_region,
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

        CartItem.objects.filter(cart=cart, product_id=product_id).delete()
        cart = self._get_prefetched_cart(cart.id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def update_item(self, request):
        """Update quantity of a cart item"""
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        if quantity < 1:
            return Response(
                {"detail": "Quantity must be at least 1"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
        else:
            session_key = request.session.session_key
            if not session_key:
                return Response(
                    {"detail": "No cart found"}, status=status.HTTP_400_BAD_REQUEST
                )
            cart = get_object_or_404(Cart, session_key=session_key, user=None)

        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
        except CartItem.DoesNotExist:
            return Response(
                {"detail": "Item not found in cart"}, status=status.HTTP_404_NOT_FOUND
            )

        # Validate stock before updating
        try:
            inv = Inventory.objects.get(product_id=product_id)
            if inv.available() < quantity:
                return Response(
                    {"detail": f"Only {inv.available()} items available in stock"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Inventory.DoesNotExist:
            return Response(
                {"detail": "Product not found or out of stock"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_item.quantity = quantity
        cart_item.save()

        cart = self._get_prefetched_cart(cart.id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

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

        CartItem.objects.filter(cart=cart).delete()
        cart = self._get_prefetched_cart(cart.id)
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

        # Admin users can see all orders
        if user.is_staff or getattr(user, "role", None) == "admin":
            return (
                Order.objects.all()
                .select_related("user")
                .prefetch_related("items__product")
            )

        # Regular users can only see their own orders
        return (
            Order.objects.filter(user=user)
            .select_related("user")
            .prefetch_related("items__product")
        )

    def get_object(self):
        """Override to add row-level security check."""
        obj = super().get_object()
        user = self.request.user

        if user.is_staff or getattr(user, "role", None) == "admin":
            return obj

        if obj.user != user:
            if not obj.guest_email or obj.guest_email != user.email:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied("You do not have permission to view this order")

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
        """
        from .invoice import generate_invoice_pdf, get_invoice_pdf_url
        from django.http import HttpResponse

        order = self.get_object()

        # Check if invoice exists
        try:
            invoice = order.invoice
        except Order.invoice.RelatedObjectDoesNotExist:
            # Generate invoice if not exists
            pdf_result, invoice_number = generate_invoice_pdf(order)
            if pdf_result:
                return HttpResponse(pdf_result, content_type="application/pdf")
            else:
                return Response(
                    {"detail": "Failed to generate invoice"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        # If invoice has PDF, serve it
        if invoice.pdf_file:
            pdf_path = invoice.pdf_file.path
            with open(pdf_path, "rb") as f:
                pdf_content = f.read()
            invoice.download_count += 1
            invoice.save(update_fields=["download_count"])
            response = HttpResponse(pdf_content, content_type="application/pdf")
            response["Content-Disposition"] = (
                f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
            )
            return response

        # Generate PDF if no file exists
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
