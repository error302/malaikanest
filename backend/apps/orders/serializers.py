from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, Coupon
from apps.products.serializers import ProductSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'quantity')


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'user', 'items', 'created_at', 'subtotal', 'total')

    def get_subtotal(self, obj):
        # Use already-prefetched items to avoid N+1 queries
        return sum(ci.product.price * ci.quantity for ci in obj.items.all())

    def get_total(self, obj):
        return self.get_subtotal(obj)


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'price', 'quantity')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'user', 'total', 'status', 'items', 'created_at',
            'receipt_number', 'delivery_region', 'is_gift', 'gift_message',
            'guest_email',
        )


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ('id', 'code', 'amount', 'active')
