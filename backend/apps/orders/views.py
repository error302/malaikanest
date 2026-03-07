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
from .serializers import CartSerializer, CartItemSerializer, OrderSerializer, CouponSerializer


class OrderPagination(pagination.PageNumberPagination):
    """MED-05: Paginate all order lists to prevent memory exhaustion on large datasets."""
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class CartViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def list(self, request):
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            cart = self._get_or_create_guest_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def _get_or_create_guest_cart(self, request):
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key
        cart, _ = Cart.objects.get_or_create(session_key=session_key, user=None)
        return cart

    @action(detail=False, methods=['post'])
    def add(self, request):
        product_id = request.data.get('product_id')
        qty = int(request.data.get('quantity', 1))

        if qty < 1:
            return Response({'detail': 'Quantity must be at least 1'}, status=status.HTTP_400_BAD_REQUEST)

        # MED-06: Validate stock before adding to cart
        try:
            inv = Inventory.objects.get(product_id=product_id)
            if inv.available() < qty:
                return Response(
                    {'detail': f'Only {inv.available()} items available in stock'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Inventory.DoesNotExist:
            return Response({'detail': 'Product not found or out of stock'}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            cart = self._get_or_create_guest_cart(request)

        ci, created = CartItem.objects.get_or_create(
            cart=cart, product_id=product_id, defaults={'quantity': qty}
        )
        if not created:
            # Validate total qty against available stock
            new_qty = ci.quantity + qty
            inv = Inventory.objects.get(product_id=product_id)
            if inv.available() < new_qty:
                return Response(
                    {'detail': f'Cannot add {qty} more — only {inv.available()} available'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ci.quantity = new_qty
            ci.save()
        return Response({'detail': 'added'})

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        is_guest = request.data.get('is_guest', False)
        guest_email = request.data.get('guest_email')
        guest_phone = request.data.get('guest_phone')

        if is_guest and guest_email:
            return self._guest_checkout(request, guest_email, guest_phone)

        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        cart = get_object_or_404(Cart, user=request.user)
        coupon_code = request.data.get('coupon')
        coupon = None
        if coupon_code:
            coupon = get_object_or_404(Coupon, code=coupon_code, active=True)
        receipt = get_random_string(32)
        delivery_region = request.data.get('delivery_region', 'nairobi')
        try:
            try:
                order = create_order_from_cart(
                    request.user,
                    cart,
                    coupon=coupon,
                    receipt_number=receipt,
                    delivery_region=delivery_region,
                )
            except TypeError:
                # Backward compatibility for deployments where helper signature lacks delivery_region.
                order = create_order_from_cart(
                    request.user,
                    cart,
                    coupon=coupon,
                    receipt_number=receipt,
                )
                if hasattr(order, "delivery_region"):
                    order.delivery_region = delivery_region
                    order.save(update_fields=["delivery_region", "updated_at"])
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    def _guest_checkout(self, request, guest_email, guest_phone):
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key

        cart = get_object_or_404(Cart, session_key=session_key, user=None)

        if not cart.items.exists():
            return Response({'detail': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        user = None
        try:
            user = User.objects.get(email=guest_email)
        except User.DoesNotExist:
            pass

        coupon_code = request.data.get('coupon')
        coupon = None
        if coupon_code:
            coupon = get_object_or_404(Coupon, code=coupon_code, active=True)

        receipt = get_random_string(32)

        try:
            with transaction.atomic():
                total = 0
                items = []
                cart_items = cart.items.select_related('product').all()
                product_ids = [ci.product_id for ci in cart_items]

                # CRIT-09: Lock all inventory rows at once (same pattern as create_order_from_cart)
                inventories = {
                    inv.product_id: inv
                    for inv in Inventory.objects.select_for_update().filter(product_id__in=product_ids)
                }

                for ci in cart_items:
                    inv = inventories.get(ci.product_id)
                    if inv is None:
                        raise ValueError(f'No inventory record found for {ci.product.name}')
                    if inv.available() < ci.quantity:
                        raise ValueError(f'Product {ci.product.name} out of stock. Available: {inv.available()}')
                    total += ci.product.price * ci.quantity
                    items.append((ci.product, ci.quantity, ci.product.price, inv))

                if coupon and coupon.active:
                    total = max(total - coupon.amount, 0)

                from .models import DELIVERY_FEES
                delivery_region = request.data.get('delivery_region', 'nairobi')
                delivery_fee = DELIVERY_FEES.get(delivery_region, 0)
                total += delivery_fee

                order = Order.objects.create(
                    user=user,
                    total=total,
                    status='pending',
                    coupon=coupon,
                    receipt_number=receipt,
                    guest_email=guest_email,
                    guest_phone=guest_phone,
                    delivery_region=delivery_region,
                )

                for product, qty, price, inv in items:
                    # CRIT-09: Use F() expressions for atomic inventory deduction
                    Inventory.objects.filter(pk=inv.pk).update(
                        quantity=F('quantity') - qty,
                        reserved=F('reserved') - qty,
                    )
                    OrderItem.objects.create(order=order, product=product, price=price, quantity=qty)

                cart.items.all().delete()

        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderSerializer(order)
        return Response({
            **serializer.data,
            'is_guest': True,
            'guest_checkout': True,
        })

    @action(detail=False, methods=['post'], url_path='remove/(?P<product_id>[^/.]+)')
    def remove(self, request, product_id=None):
        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
        else:
            session_key = request.session.session_key
            if not session_key:
                return Response({'detail': 'No cart found'}, status=status.HTTP_400_BAD_REQUEST)
            cart = get_object_or_404(Cart, session_key=session_key, user=None)

        CartItem.objects.filter(cart=cart, product_id=product_id).delete()
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def update_item(self, request):
        """Update quantity of a cart item"""
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if quantity < 1:
            return Response({'detail': 'Quantity must be at least 1'}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
        else:
            session_key = request.session.session_key
            if not session_key:
                return Response({'detail': 'No cart found'}, status=status.HTTP_400_BAD_REQUEST)
            cart = get_object_or_404(Cart, session_key=session_key, user=None)

        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
            cart_item.quantity = quantity
            cart_item.save()
        except CartItem.DoesNotExist:
            return Response({'detail': 'Item not found in cart'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def clear_cart(self, request):
        """Clear all items from the cart"""
        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
        else:
            session_key = request.session.session_key
            if not session_key:
                return Response({'detail': 'No cart found'}, status=status.HTTP_400_BAD_REQUEST)
            cart = get_object_or_404(Cart, session_key=session_key, user=None)

        CartItem.objects.filter(cart=cart).delete()
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
        if user.is_staff or getattr(user, 'role', None) == 'admin':
            return Order.objects.all().select_related('user').prefetch_related('items__product')

        # Regular users can only see their own orders
        return Order.objects.filter(user=user).select_related('user').prefetch_related('items__product')

    def get_object(self):
        """Override to add row-level security check."""
        obj = super().get_object()
        user = self.request.user

        if user.is_staff or getattr(user, 'role', None) == 'admin':
            return obj

        if obj.user != user:
            if not obj.guest_email or obj.guest_email != user.email:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have permission to view this order")

        return obj

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()

        if order.status in ['paid', 'initiated', 'processing', 'shipped']:
            return Response({'detail': 'Cannot cancel this order in its current state'}, status=400)

        if order.status == 'cancelled':
            return Response({'detail': 'Order is already cancelled'}, status=400)

        # MED-01: Restore inventory when order is cancelled
        with transaction.atomic():
            for item in order.items.select_related('product').all():
                Inventory.objects.filter(product=item.product).update(
                    quantity=F('quantity') + item.quantity,
                )
            order.status = 'cancelled'
            order.save()

        return Response({'detail': 'cancelled'})

    @action(detail=True, methods=['post'])
    def retry_payment(self, request, pk=None):
        """
        MED-02: Allow customers to retry payment after payment_failed status.
        Resets order to pending so a new payment can be initiated.
        """
        order = self.get_object()

        if order.status != 'payment_failed':
            return Response(
                {'detail': 'Can only retry payment for orders with payment_failed status'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Reset order to pending and clear the failed payment
        with transaction.atomic():
            # Delete failed payment to allow new one
            if hasattr(order, 'payment') and order.payment.status == 'failed':
                order.payment.delete()
            order.status = 'pending'
            order.save()

        return Response({
            'detail': 'Order reset to pending. You can now retry payment.',
            'order_id': order.id,
        })

