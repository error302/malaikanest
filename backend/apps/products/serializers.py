from rest_framework import serializers

from apps.orders.models import Order

from .models import Banner, Brand, Category, Inventory, Product, ProductVariant, Review, Wishlist, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "slug")


class BrandSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = ("id", "name", "slug", "logo", "description", "is_active")

    def get_logo(self, obj):
        if obj.logo:
            url = obj.logo.url
            if url.startswith("http://") or url.startswith("https://"):
                return url
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(url)
            return f"https://malaikanest.com{url}"
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
            url = obj.image.url
            if url.startswith("http://") or url.startswith("https://"):
                return url
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(url)
            return f"https://malaikanest.com{url}"
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
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True, required=True
    )
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), source="brand", write_only=True, required=False, allow_null=True
    )
    image = serializers.SerializerMethodField()
    image_url = serializers.URLField(write_only=True, required=False, allow_blank=True)
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    is_in_stock = serializers.SerializerMethodField()
    available_stock = serializers.ReadOnlyField()
    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    tags = serializers.SerializerMethodField()
    meta_title = serializers.CharField(source="seo_title", read_only=True)
    meta_description = serializers.CharField(source="seo_description", read_only=True)
    variants = serializers.SerializerMethodField()
    has_variants = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "sku",
            "description",
            "category",
            "category_id",
            "brand",
            "brand_id",
            "tags",
            "price",
            "compare_price",
            "discount_price",
            "discount_percentage",
            "stock",
            "available_stock",
            "low_stock_threshold",
            "in_stock",
            "is_in_stock",
            "weight",
            "gender",
            "age_group",
            "age_range",
            "size_label",
            "featured",
            "status",
            "seo_title",
            "seo_description",
            "meta_title",
            "meta_description",
            "image",
            "image_url",
            "is_active",
            "has_variants",
            "variants",
            "avg_rating",
            "review_count",
            "created_at",
            "updated_at",
        )

    def _handle_image(self, product, context, image_url=None):
        request = context.get("request") if isinstance(context, dict) else self.context.get("request")
        image_file = None
        if request and request.FILES:
            image_file = request.FILES.get("image") or request.FILES.get("uploaded_images")
        if image_file:
            product.image = image_file
        elif image_url:
            product.image = image_url
        if image_file or image_url:
            product.save(update_fields=["image"])

    def create(self, validated_data):
        validated_data.pop("tags", None)
        image_url = validated_data.pop("image_url", None)
        product = Product.objects.create(**validated_data)
        Inventory.objects.get_or_create(
            product=product, defaults={"quantity": product.stock}
        )
        self._handle_image(product, self.context, image_url)
        return product

    def update(self, instance, validated_data):
        validated_data.pop("tags", None)
        image_url = validated_data.pop("image_url", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        request = self.context.get("request")
        image_file = None
        if request and request.FILES:
            image_file = request.FILES.get("image") or request.FILES.get("uploaded_images")
        if image_file:
            instance.image = image_file
        elif image_url is not None:
            instance.image = image_url
        instance.save()
        return instance

    def get_image(self, obj):
        if obj.image:
            raw = obj.image.name if hasattr(obj.image, "name") else str(obj.image)
            if raw.startswith("http://") or raw.startswith("https://"):
                return raw
            url = obj.image.url
            if url.startswith("http://") or url.startswith("https://"):
                return url
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(url)
            return f"https://malaikanest.com{url}"
        return None

    def get_is_in_stock(self, obj):
        try:
            return obj.available_stock > 0
        except Exception:
            return bool(getattr(obj, "stock", 0) > 0)

    def get_tags(self, obj):
        return list(obj.tags.values("id", "name", "slug"))

    def get_has_variants(self, obj):
        return obj.variants.filter(is_active=True).exists()

    def get_variants(self, obj):
        variants = obj.variants.filter(is_active=True).select_related("inventory").order_by("color", "size", "id")
        request = self.context.get("request")
        items = []
        for variant in variants:
            image_url = None
            if variant.image:
                image_url = variant.image.url
                if request and not image_url.startswith(("http://", "https://")):
                    image_url = request.build_absolute_uri(image_url)
            elif obj.image:
                image_url = self.get_image(obj)

            effective_price = obj.price + variant.price_modifier
            available_stock = variant.inventory.available() if hasattr(variant, "inventory") else 0
            items.append(
                {
                    "id": variant.id,
                    "color": variant.color,
                    "color_label": variant.get_color_display() if variant.color else "",
                    "size": variant.size,
                    "size_label": variant.get_size_display() if variant.size else "",
                    "sku": variant.sku,
                    "price_modifier": str(variant.price_modifier),
                    "effective_price": str(effective_price),
                    "image": image_url,
                    "quantity": getattr(getattr(variant, "inventory", None), "quantity", 0),
                    "available_stock": available_stock,
                    "is_active": variant.is_active,
                }
            )
        return items


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
    has_variants = serializers.SerializerMethodField()

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
            "has_variants",
            "avg_rating",
            "review_count",
            "popularity",
        )

    def get_image(self, obj):
        if obj.image:
            url = obj.image.url
            if url.startswith("http://") or url.startswith("https://"):
                return url
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(url)
            return f"https://malaikanest.com{url}"
        return None

    def get_has_variants(self, obj):
        return obj.variants.filter(is_active=True).exists()


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
    image_url = serializers.URLField(write_only=True, required=False, allow_blank=True)
    mobile_image_url = serializers.URLField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Banner
        fields = (
            "id",
            "title",
            "subtitle",
            "button_text",
            "button_link",
            "image",
            "image_url",
            "mobile_image",
            "mobile_image_url",
            "is_active",
            "position",
            "start_date",
            "end_date",
        )

    def _handle_images(self, banner, validated_data):
        request = self.context.get("request")
        image_url = validated_data.pop("image_url", None)
        mobile_image_url = validated_data.pop("mobile_image_url", None)
        image_file = None
        mobile_file = None
        if request and request.FILES:
            image_file = request.FILES.get("image")
            mobile_file = request.FILES.get("mobile_image")
        if image_file:
            banner.image = image_file
        elif image_url is not None:
            banner.image = image_url
        if mobile_file:
            banner.mobile_image = mobile_file
        elif mobile_image_url is not None:
            banner.mobile_image = mobile_image_url
        if image_file or image_url is not None or mobile_file or mobile_image_url is not None:
            banner.save()

    def create(self, validated_data):
        banner = Banner.objects.create(**validated_data)
        self._handle_images(banner, validated_data)
        return banner

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        self._handle_images(instance, validated_data)
        instance.save()
        return instance

    def get_image(self, obj):
        return obj.get_image_url

    def get_mobile_image(self, obj):
        return obj.get_mobile_image_url
