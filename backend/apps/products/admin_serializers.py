from django.db import IntegrityError, transaction
from rest_framework import serializers

from apps.accounts.models import User
from apps.orders.models import Order, OrderItem
from apps.products.models import Banner, Category, Inventory, InventoryLog, Product


class AdminCategorySerializer(serializers.ModelSerializer):
    full_slug = serializers.CharField(read_only=True)
    level = serializers.IntegerField(read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    image_full_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "full_slug",
            "description",
            "parent",
            "group",
            "image",
            "image_full_url",
            "level",
        ]
        read_only_fields = ["id", "slug", "full_slug", "level"]
        extra_kwargs = {
            "parent": {"required": False, "allow_null": True},
        }

    def get_image_full_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            from django.conf import settings

            return f"{settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'https://malaikanest.duckdns.org'}{obj.image.url}"
        return None


class AdminProductSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    image_full_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "compare_price",
            "discount_price",
            "category",
            "category_name",
            "brand",
            "featured",
            "is_active",
            "stock",
            "sku",
            "image",
            "image_url",
            "image_full_url",
            "gender",
            "age_group",
            "age_range",
            "size_label",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_category_name(self, obj):
        category = getattr(obj, "category", None)
        return getattr(category, "full_slug", "") or ""

    def get_image_full_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            # Fallback: construct URL manually
            from django.conf import settings

            return f"{settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'https://malaikanest.duckdns.org'}{obj.image.url}"
        return None

    def create(self, validated_data):
        image_url = validated_data.pop("image_url", None)
        stock = validated_data.get("stock", 0)

        # If image_url is provided, download and save the image
        if image_url:
            try:
                import requests
                from django.core.files.base import ContentFile

                response = requests.get(image_url, timeout=10)
                if response.status_code == 200:
                    from urllib.parse import urlparse

                    parsed = urlparse(image_url)
                    filename = parsed.path.split("/")[-1] or "product_image.jpg"
                    validated_data["image"] = ContentFile(
                        response.content, name=filename
                    )
            except Exception:
                pass  # If image download fails, continue without image

        try:
            with transaction.atomic():
                product = super().create(validated_data)
                Inventory.objects.update_or_create(
                    product=product, defaults={"quantity": stock}
                )
                if stock:
                    InventoryLog.objects.create(
                        product=product,
                        change_type="manual_adjustment",
                        quantity_change=stock,
                        reason="Initial stock set from admin product creation",
                    )
                return product
        except IntegrityError as exc:
            message = str(exc).lower()
            if "slug" in message:
                raise serializers.ValidationError(
                    {"slug": ["This slug is already in use."]}
                )
            if "sku" in message:
                raise serializers.ValidationError(
                    {"sku": ["This SKU is already in use."]}
                )
            raise serializers.ValidationError(
                {"detail": "Could not create product due to a database constraint."}
            )

    def update(self, instance, validated_data):
        image_url = validated_data.pop("image_url", None)

        # If image_url is provided, download and save the image
        if image_url:
            try:
                import requests
                from django.core.files.base import ContentFile

                response = requests.get(image_url, timeout=10)
                if response.status_code == 200:
                    from urllib.parse import urlparse

                    parsed = urlparse(image_url)
                    filename = parsed.path.split("/")[-1] or "product_image.jpg"
                    validated_data["image"] = ContentFile(
                        response.content, name=filename
                    )
            except Exception:
                pass  # If image download fails, continue without image

        previous_stock = instance.stock
        try:
            with transaction.atomic():
                product = super().update(instance, validated_data)
                if "stock" in validated_data:
                    Inventory.objects.update_or_create(
                        product=product, defaults={"quantity": product.stock}
                    )
                    diff = product.stock - previous_stock
                    if diff:
                        InventoryLog.objects.create(
                            product=product,
                            change_type="manual_adjustment",
                            quantity_change=diff,
                            reason="Stock adjusted from admin product editor",
                        )
                return product
        except IntegrityError as exc:
            message = str(exc).lower()
            if "slug" in message:
                raise serializers.ValidationError(
                    {"slug": ["This slug is already in use."]}
                )
            if "sku" in message:
                raise serializers.ValidationError(
                    {"sku": ["This SKU is already in use."]}
                )
            raise serializers.ValidationError(
                {"detail": "Could not update product due to a database constraint."}
            )


class AdminBannerSerializer(serializers.ModelSerializer):
    button_link = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    image = serializers.ImageField(required=False, allow_null=True)
    mobile_image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    mobile_image_url = serializers.URLField(
        required=False, allow_blank=True, allow_null=True
    )
    image_full_url = serializers.SerializerMethodField(read_only=True)
    mobile_image_full_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Banner
        fields = [
            "id",
            "title",
            "subtitle",
            "image",
            "image_url",
            "image_full_url",
            "mobile_image",
            "mobile_image_url",
            "mobile_image_full_url",
            "button_text",
            "button_link",
            "position",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_image_full_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            from django.conf import settings

            return f"{settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'https://malaikanest.duckdns.org'}{obj.image.url}"
        return None

    def get_mobile_image_full_url(self, obj):
        if obj.mobile_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.mobile_image.url)
            from django.conf import settings

            return f"{settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'https://malaikanest.duckdns.org'}{obj.mobile_image.url}"
        return None

    def create(self, validated_data):
        """
        Store remote banner URLs directly in the image_url/mobile_image_url
        fields instead of downloading them server-side.

        - If the admin uploads a file, DRF will handle saving it to the
          ImageField as usual.
        - If the admin pastes a Cloudinary (or other CDN) URL, it will be
          stored in the corresponding URL field and served directly.
        """
        return super().create(validated_data)


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
    price_at_purchase = serializers.DecimalField(
        source="price", max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = ["id", "product_name", "price_at_purchase", "quantity"]


class AdminOrderSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    customer_name = serializers.SerializerMethodField()
    order_number = serializers.CharField(source="receipt_number", read_only=True)
    payment_status = serializers.SerializerMethodField()
    shipping_phone = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "user",
            "user_email",
            "customer_name",
            "items",
            "total",
            "status",
            "payment_status",
            "delivery_region",
            "receipt_number",
            "shipping_phone",
            "mpesa_receipt_number",
            "guest_email",
            "guest_phone",
            "created_at",
            "updated_at",
        ]

    def get_customer_name(self, obj):
        if obj.user:
            full_name = (
                f"{obj.user.first_name or ''} {obj.user.last_name or ''}".strip()
            )
            return full_name or obj.user.email
        return obj.guest_email or "Guest"

    def get_payment_status(self, obj):
        payment = getattr(obj, "payment", None)
        if payment:
            return payment.status
        if obj.status == "paid":
            return "completed"
        if obj.status in {"payment_failed", "failed", "cancelled"}:
            return "failed"
        return "pending"

    def get_shipping_phone(self, obj):
        return obj.shipping_phone or obj.guest_phone or ""
