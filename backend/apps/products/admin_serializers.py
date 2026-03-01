from rest_framework import serializers
from apps.products.models import Category, Product, Banner
from apps.accounts.models import User
from apps.orders.models import Order, OrderItem


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image",
            "is_active",
            "created_at",
            "updated_at",
        ]


class AdminProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "discount_price",
            "category",
            "category_name",
            "brand",
            "featured",
            "is_active",
            "stock",
            "sku",
            "image",
            "gender",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AdminBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = [
            "id",
            "title",
            "subtitle",
            "image",
            "button_text",
            "button_link",
            "order",
            "is_active",
            "created_at",
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    total_orders = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "is_staff",
            "is_superuser",
            "is_active",
            "role",
            "date_joined",
            "total_orders",
        ]

    def get_total_orders(self, obj):
        return Order.objects.filter(user=obj).count()


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product_name", "price_at_purchase", "quantity"]


class AdminOrderSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "user",
            "user_email",
            "items",
            "total",
            "status",
            "payment_status",
            "shipping_address",
            "shipping_phone",
            "shipping_name",
            "delivery_region",
            "receipt_number",
            "created_at",
            "updated_at",
        ]
