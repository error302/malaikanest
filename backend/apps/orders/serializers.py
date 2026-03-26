from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, Coupon
from apps.products.serializers import ProductSerializer
from decimal import Decimal
from .models import DELIVERY_FEES


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'quantity', 'unit_price')


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    coupon = serializers.SerializerMethodField()
    delivery_region = serializers.CharField(read_only=True)
    subtotal = serializers.SerializerMethodField()
    discount = serializers.SerializerMethodField()
    delivery_fee = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = (
            'id',
            'user',
            'items',
            'coupon',
            'delivery_region',
            'created_at',
            'subtotal',
            'discount',
            'delivery_fee',
            'total',
        )

    def get_subtotal(self, obj):
        return str(obj.subtotal_amount())

    def get_discount(self, obj):
        return str(obj.discount_amount())

    def get_delivery_fee(self, obj):
        try:
            return str(Decimal(str(DELIVERY_FEES.get(obj.delivery_region, 0))).quantize(Decimal("0.01")))
        except Exception:
            return "0.00"

    def get_total(self, obj):
        subtotal = Decimal(self.get_subtotal(obj))
        discount = Decimal(self.get_discount(obj))
        delivery_fee = Decimal(self.get_delivery_fee(obj))
        total = max(subtotal - discount, Decimal("0.00")) + delivery_fee
        return str(total.quantize(Decimal("0.01")))

    def get_coupon(self, obj):
        if not obj.coupon:
            return None
        return {
            "id": obj.coupon_id,
            "code": obj.coupon.code,
            "discount_type": obj.coupon.discount_type,
            "discount_value": str(obj.coupon.discount_value),
        }


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
            'id', 'user', 'subtotal', 'delivery_fee', 'tax_amount', 'discount_amount',
            'total', 'status', 'items', 'created_at',
            'receipt_number', 'delivery_region', 'is_gift', 'gift_message',
            'guest_email',
        )


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            'id',
            'code',
            'discount_type',
            'discount_value',
            'min_order_value',
            'max_uses',
            'used_count',
            'valid_from',
            'valid_to',
            'is_active',
        )

