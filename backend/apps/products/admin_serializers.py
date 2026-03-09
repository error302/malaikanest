from rest_framework import serializers
from apps.products.models import Category, Product, Banner
from apps.accounts.models import User
from apps.orders.models import Order, OrderItem


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'parent',
            'group',
            'image',
        ]
        read_only_fields = ['id', 'slug']


class AdminProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'price',
            'discount_price',
            'category',
            'category_name',
            'brand',
            'featured',
            'is_active',
            'stock',
            'sku',
            'image',
            'gender',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminBannerSerializer(serializers.ModelSerializer):
    # Accept relative links such as /categories for in-site banner CTAs.
    button_link = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Banner
        fields = [
            'id',
            'title',
            'subtitle',
            'image',
            'mobile_image',
            'button_text',
            'button_link',
            'position',
            'start_date',
            'end_date',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AdminUserSerializer(serializers.ModelSerializer):
    total_orders = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'phone',
            'is_staff',
            'is_superuser',
            'is_active',
            'role',
            'date_joined',
            'total_orders',
        ]

    def get_total_orders(self, obj):
        return Order.objects.filter(user=obj).count()


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    price_at_purchase = serializers.DecimalField(
        source='price',
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'price_at_purchase', 'quantity']


class AdminOrderSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    customer_name = serializers.SerializerMethodField()
    order_number = serializers.CharField(source='receipt_number', read_only=True)
    payment_status = serializers.SerializerMethodField()
    shipping_phone = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'user',
            'user_email',
            'customer_name',
            'items',
            'total',
            'status',
            'payment_status',
            'delivery_region',
            'receipt_number',
            'shipping_phone',
            'mpesa_receipt_number',
            'guest_email',
            'guest_phone',
            'created_at',
            'updated_at',
        ]

    def get_customer_name(self, obj):
        if obj.user:
            full_name = f"{obj.user.first_name or ''} {obj.user.last_name or ''}".strip()
            return full_name or obj.user.email
        return obj.guest_email or 'Guest'

    def get_payment_status(self, obj):
        payment = getattr(obj, 'payment', None)
        if payment:
            return payment.status
        if obj.status == 'paid':
            return 'completed'
        if obj.status in {'payment_failed', 'failed', 'cancelled'}:
            return 'failed'
        return 'pending'

    def get_shipping_phone(self, obj):
        return obj.shipping_phone or obj.guest_phone or ''
