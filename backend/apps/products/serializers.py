from rest_framework import serializers

from apps.orders.models import Order

from .models import Banner, Brand, Category, Inventory, Product, Review, Wishlist


class BrandSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = ("id", "name", "slug", "logo", "description", "is_active")

    def get_logo(self, obj):
        if obj.logo:
            return obj.logo.url
        return None


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    is_top_level = serializers.BooleanField(read_only=True)
    group = serializers.CharField(read_only=True)
    product_count = serializers.SerializerMethodField()
    full_slug = serializers.CharField(read_only=True)
    level = serializers.IntegerField(read_only=True)
    breadcrumb = serializers.JSONField(read_only=True)

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "full_slug",
            "description",
            "image",
            "parent",
            "children",
            "is_top_level",
            "group",
            "level",
            "breadcrumb",
            "product_count",
        )
        read_only_fields = (
            "slug",
            "children",
            "is_top_level",
            "group",
            "product_count",
            "full_slug",
            "level",
            "breadcrumb",
        )
        extra_kwargs = {
            "parent": {"required": False, "allow_null": True},
        }

    def get_image(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f"https://malaikanest.duckdns.org{obj.image.url}"
        return None

    def get_children(self, obj):
        children = obj.children.all().order_by("name")
        return (
            CategorySerializer(children, many=True, context=self.context).data
            if children
            else []
        )

    def get_product_count(self, obj):
        descendant_ids = obj.descendant_ids(include_self=True)
        return Product.objects.filter(
            category_id__in=descendant_ids, is_active=True
        ).count()


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    available_stock = serializers.ReadOnlyField()
    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "sku",
            "description",
            "category",
            "brand",
            "price",
            "compare_price",
            "discount_price",
            "discount_percentage",
            "stock",
            "available_stock",
            "low_stock_threshold",
            "in_stock",
            "weight",
            "gender",
            "age_group",
            "age_range",
            "size_label",
            "featured",
            "status",
            "seo_title",
            "seo_description",
            "image",
            "is_active",
            "avg_rating",
            "review_count",
            "created_at",
            "updated_at",
        )

    def create(self, validated_data):
        request = self.context.get("request")
        image = None
        if request and request.FILES:
            files = request.FILES.getlist("uploaded_images")
            if files:
                image = files[0]

        product = Product.objects.create(**validated_data)
        Inventory.objects.get_or_create(
            product=product, defaults={"quantity": product.stock}
        )
        if image:
            product.image = image
            product.save(update_fields=["image"])

        return product

    def get_image(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            from django.conf import settings

            return f"https://malaikanest.duckdns.org{obj.image.url}"
        return None


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    available_stock = serializers.ReadOnlyField()
    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    popularity = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "brand",
            "price",
            "compare_price",
            "discount_price",
            "discount_percentage",
            "stock",
            "available_stock",
            "featured",
            "status",
            "image",
            "gender",
            "age_group",
            "age_range",
            "size_label",
            "in_stock",
            "is_active",
            "avg_rating",
            "review_count",
            "popularity",
        )

    def get_image(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            from django.conf import settings

            return f"https://malaikanest.duckdns.org{obj.image.url}"
        return None


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ("id", "product", "quantity", "reserved")


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.IntegerField(source="user_id", read_only=True)
    user_email_masked = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    comment = serializers.CharField(source="body", read_only=True)
    location = serializers.SerializerMethodField()

    def validate(self, attrs):
        request = self.context.get("request")
        product = attrs.get("product") or getattr(self.instance, "product", None)

        if request and request.user.is_authenticated and product:
            existing = Review.objects.filter(product=product, user=request.user)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    {"detail": "You have already reviewed this product."}
                )

            has_purchased = product.orderitem_set.filter(
                order__user=request.user,
                order__status__in=[
                    Order.STATUS_PAID,
                    Order.STATUS_PROCESSING,
                    Order.STATUS_SHIPPED,
                    Order.STATUS_DELIVERED,
                ],
            ).exists()
            if not has_purchased:
                raise serializers.ValidationError(
                    {"detail": "Only verified buyers can review this product."}
                )

        return attrs

    class Meta:
        model = Review
        fields = (
            "id",
            "product",
            "user",
            "user_email",
            "user_email_masked",
            "user_name",
            "location",
            "rating",
            "title",
            "body",
            "comment",
            "created_at",
        )
        read_only_fields = (
            "user",
            "user_email",
            "user_email_masked",
            "user_name",
            "comment",
            "location",
            "created_at",
        )

    def get_user_email_masked(self, obj):
        if not obj.user_email:
            return None
        email = obj.user_email
        if "@" in email:
            local, domain = email.split("@", 1)
            masked_local = local[:3] + "***" if len(local) > 3 else local
            return f"{masked_local}@{domain}"
        return email[:4] + "***"

    def get_user_name(self, obj):
        if obj.user:
            full_name = (
                f"{obj.user.first_name or ''} {obj.user.last_name or ''}".strip()
            )
            if full_name:
                return full_name
            return obj.user.email.split("@")[0]
        if obj.user_email:
            return obj.user_email.split("@")[0]
        return "Customer"

    def get_location(self, _obj):
        return "Kenya"


class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = ("id", "user", "product", "created_at")
        read_only_fields = ("user",)


class BannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    mobile_image = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = (
            "id",
            "title",
            "subtitle",
            "button_text",
            "button_link",
            "image",
            "mobile_image",
            "is_active",
            "position",
            "start_date",
            "end_date",
        )

    def get_image(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f"https://malaikanest.duckdns.org{obj.image.url}"
        return None

    def get_mobile_image(self, obj):
        if getattr(obj, "mobile_image", None):
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.mobile_image.url)
            return f"https://malaikanest.duckdns.org{obj.mobile_image.url}"
        return None
