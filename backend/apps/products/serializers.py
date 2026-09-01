import json
import logging
import uuid

from rest_framework import serializers

logger = logging.getLogger(__name__)

from apps.orders.models import Order

from .models import Banner, Brand, Category, Inventory, Product, ProductImage, ProductVariant, Review, Wishlist, Tag


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
    has_variants = serializers.SerializerMethodField()
    variant_count = serializers.SerializerMethodField()
    variants = serializers.SerializerMethodField()

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
            "images",
            "image_url",
            "is_active",
            "has_variants",
            "variant_count",
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
        self._handle_gallery(product, self.context)
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
        self._handle_gallery(instance, self.context)
        return instance

    def _image_url(self, filed):
        if not filed:
            return None
        raw = filed.name if hasattr(filed, "name") else str(filed)
        if raw.startswith("http://") or raw.startswith("https://"):
            url = raw
        else:
            url = filed.url
        if url.startswith("http://") or url.startswith("https://"):
            if "res.cloudinary.com" in url and not any(url.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]):
                url = f"{url}.jpg"
            return url
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(url)
        return f"https://malaikanest.com{url}"

    def _primary_gallery_url(self, obj):
        if hasattr(obj, "_prefetched_objects_cache") and "images" in obj._prefetched_objects_cache:
            images = obj.images.all()
            gallery = next((img for img in images if img.is_primary), None)
            if not gallery and images:
                gallery = images[0]
        else:
            gallery = obj.images.filter(is_primary=True).first() or obj.images.first()

        if gallery and gallery.image:
            return self._image_url(gallery.image)
        return None

    def get_image(self, obj):
        if obj.image:
            return self._image_url(obj.image)
        return self._primary_gallery_url(obj)

    def get_images(self, obj):
        items = []
        for img in obj.images.all():
            if not img.image:
                continue
            raw = img.image.name if hasattr(img.image, "name") else str(img.image)
            if raw.startswith("http://") or raw.startswith("https://"):
                url = raw
            else:
                url = img.image.url
                if not (url.startswith("http://") or url.startswith("https://")):
                    request = self.context.get("request")
                    if request:
                        url = request.build_absolute_uri(url)
                    else:
                        url = f"https://malaikanest.com{url}"
            items.append({
                "id": img.id,
                "url": url,
                "alt_text": img.alt_text,
                "is_primary": img.is_primary,
            })
        return items

    def _parse_json_list(self, value):
        if value is None:
            return []
        if isinstance(value, list):
            return value
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            logger.debug("_parse_json_list failed for value=%s", str(value)[:80])
            return []

    def _norm_id(self, value):
        try:
            return str(uuid.UUID(str(value)))
        except (ValueError, AttributeError, TypeError):
            return None

    def _handle_gallery(self, product, context):
        request = context.get("request") if isinstance(context, dict) else self.context.get("request")
        if not request:
            return

        # 1) Append newly uploaded gallery images (in selection order).
        files = request.FILES.getlist("gallery_images") if request.FILES else []
        if files:
            base = product.images.count()
            for i, f in enumerate(files):
                ProductImage.objects.create(
                    product=product, image=f, position=base + i, is_primary=False
                )

        # 2) Delete images the admin removed.
        delete_ids = self._parse_json_list(request.data.get("delete_image_ids"))
        if delete_ids:
            norm = [self._norm_id(x) for x in delete_ids]
            norm = [n for n in norm if n]
            if norm:
                product.images.filter(id__in=norm).delete()

        # 3) Reorder existing images (two-pass to avoid unique_together clashes).
        order = self._parse_json_list(request.data.get("image_orders"))
        if order:
            imgs = {str(img.id): img for img in product.images.all()}
            for i, pid in enumerate(order):
                img = imgs.get(self._norm_id(pid))
                if img:
                    img.position = 1000 + i
            if imgs:
                ProductImage.objects.bulk_update(list(imgs.values()), ["position"])
            for i, pid in enumerate(order):
                img = imgs.get(self._norm_id(pid))
                if img:
                    img.position = i
            if imgs:
                ProductImage.objects.bulk_update(list(imgs.values()), ["position"])

        # 4) Set the primary gallery image.
        primary_id = self._norm_id(request.data.get("primary_image_id"))
        if primary_id:
            product.images.update(is_primary=False)
            product.images.filter(id=primary_id).update(is_primary=True)

    def get_is_in_stock(self, obj):
        try:
            return obj.available_stock > 0
        except Exception:
            logger.debug("get_is_in_stock: available_stock failed for product %s", getattr(obj, 'pk', '?'))
            return bool(getattr(obj, "stock", 0) > 0)

    def get_tags(self, obj):
        return list(obj.tags.values("id", "name", "slug"))

    def get_has_variants(self, obj):
        if hasattr(obj, "_prefetched_objects_cache") and "variants" in obj._prefetched_objects_cache:
            active_variants = [v for v in obj.variants.all() if v.is_active]
            return len(active_variants) > 1
        return obj.variants.filter(is_active=True).count() > 1

    def get_variant_count(self, obj):
        if hasattr(obj, "_prefetched_objects_cache") and "variants" in obj._prefetched_objects_cache:
            active_variants = [v for v in obj.variants.all() if v.is_active]
            return len(active_variants)
        return obj.variants.filter(is_active=True).count()

    def get_variants(self, obj):
        if hasattr(obj, "_prefetched_objects_cache") and "variants" in obj._prefetched_objects_cache:
            variants = [v for v in obj.variants.all() if v.is_active]
            variants.sort(key=lambda x: (x.color or "", x.size or "", x.id))
        else:
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
    variant_count = serializers.SerializerMethodField()

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
            "variant_count",
            "avg_rating",
            "review_count",
            "popularity",
        )

    def _image_url(self, filed):
        if not filed:
            return None
        raw = filed.name if hasattr(filed, "name") else str(filed)
        if raw.startswith("http://") or raw.startswith("https://"):
            return raw
        url = filed.url
        if url.startswith("http://") or url.startswith("https://"):
            return url
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(url)
        return f"https://malaikanest.com{url}"

    def _primary_gallery_url(self, obj):
        if hasattr(obj, "_prefetched_objects_cache") and "images" in obj._prefetched_objects_cache:
            images = obj.images.all()
            gallery = next((img for img in images if img.is_primary), None)
            if not gallery and images:
                gallery = images[0]
        else:
            gallery = obj.images.filter(is_primary=True).first() or obj.images.first()

        if gallery and gallery.image:
            return self._image_url(gallery.image)
        return None

    def get_image(self, obj):
        if obj.image:
            return self._image_url(obj.image)
        return self._primary_gallery_url(obj)

    def get_has_variants(self, obj):
        if hasattr(obj, "_prefetched_objects_cache") and "variants" in obj._prefetched_objects_cache:
            active_variants = [v for v in obj.variants.all() if v.is_active]
            return len(active_variants) > 1
        return obj.variants.filter(is_active=True).count() > 1

    def get_variant_count(self, obj):
        if hasattr(obj, "_prefetched_objects_cache") and "variants" in obj._prefetched_objects_cache:
            active_variants = [v for v in obj.variants.all() if v.is_active]
            return len(active_variants)
        return obj.variants.filter(is_active=True).count()


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
