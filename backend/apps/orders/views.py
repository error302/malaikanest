from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem, Order, OrderItem, Coupon, create_order_from_cart
from .serializers import CartSerializer, CartItemSerializer, OrderSerializer, CouponSerializer
from django.db import transaction
from django.utils.crypto import get_random_string
from apps.accounts.models import User


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
        
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            cart = self._get_or_create_guest_cart(request)
            
        ci, created = CartItem.objects.get_or_create(cart=cart, product_id=product_id, defaults={'quantity': qty})
        if not created:
            ci.quantity += qty
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
        try:
            order = create_order_from_cart(request.user, cart, coupon=coupon, receipt_number=receipt)
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
                from apps.products.models import Inventory
                for ci in cart.items.select_related('product').all():
                    inv = Inventory.objects.select_for_update().get(product=ci.product)
                    if inv.available() < ci.quantity:
                        raise ValueError(f'Product {ci.product.name} out of stock')
                    total += ci.product.price * ci.quantity
                    items.append((ci.product, ci.quantity, ci.product.price, inv))

                if coupon and coupon.active:
                    total = max(total - coupon.amount, 0)

                order = Order.objects.create(
                    user=user,
                    total=total,
                    status='pending',
                    coupon=coupon,
                    receipt_number=receipt,
                    guest_email=guest_email,
                    guest_phone=guest_phone
                )

                for product, qty, price, inv in items:
                    inv.quantity -= qty
                    inv.reserved = max(inv.reserved - qty, 0)
                    inv.save()
                    OrderItem.objects.create(order=order, product=product, price=price, quantity=qty)

                cart.items.all().delete()
                
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = OrderSerializer(order)
        return Response({
            **serializer.data,
            'is_guest': True,
            'guest_checkout': True
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

    @action(detail=False, methods=['post'])
    def update(self, request):
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

    @action(detail=False, methods=['post'])
    def clear(self, request):
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

    def get_queryset(self):
        user = self.request.user
        
        # Admin users can see all orders
        if user.is_staff or getattr(user, 'role', None) == 'admin':
            return Order.objects.all().select_related('user').prefetch_related('items__product')
        
        # Regular users can only see their own orders
        return Order.objects.filter(user=user).select_related('user').prefetch_related('items__product')

    def get_object(self):
        """
        Override to add row-level security check.
        Ensures users can only access their own orders.
        """
        obj = super().get_object()
        user = self.request.user
        
        # Admin can access any order
        if user.is_staff or getattr(user, 'role', None) == 'admin':
            return obj
        
        # Check if user owns this order
        if obj.user != user:
            # Also check guest email for guest orders
            if not obj.guest_email or obj.guest_email != user.email:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have permission to view this order")
        
        return obj

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        # Use get_object to ensure row-level security
        order = self.get_object()
        
        if order.status in ['paid', 'initiated']:
            return Response({'detail': 'Cannot cancel processed order'}, status=400)
        
        if order.status == 'cancelled':
            return Response({'detail': 'Order is already cancelled'}, status=400)
        
        order.status = 'cancelled'
        order.save()
        
        return Response({'detail': 'cancelled'})
