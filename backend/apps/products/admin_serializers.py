import json
import logging
import uuid

from django.db import IntegrityError, transaction
from rest_framework import serializers

logger = logging.getLogger(__name__)

from apps.accounts.models import User
from apps.orders.models import Order, OrderItem
from apps.products.models import (
    Banner,
    Category,
    Inventory,
    InventoryLog,
    Product,
    ProductImage,
    ProductVariant,
    VariantInventory,
    sync_product_stock,
)


class AdminCategorySerializer(serializers.ModelSerializer):
    full_slug = serializers.CharField(read_only=True)
    level = serializers.IntegerField(read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
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
            "image_url",
            "image_full_url",
            "level",
        ]
        read_only_fields = ["id", "slug", "full_slug", "level"]
        extra_kwargs = {
            "parent": {"required": False, "allow_null": True},
        }

    def get_image_full_url(self, obj):
        if obj.image:
            url = obj.image.url
            if url.startswith("http://") or url.startswith("https://"):
                return url
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(url)
            from django.conf import settings

            host = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else "malaikanest.com"
            if host.startswith("http://") or host.startswith("https://"):
                return f"{host}{url}"
            return f"https://{host}{url}"
        return None

    def _download_image(self, image_url):
        if not image_url:
            return None
        try:
            import requests
            from django.core.files.base import ContentFile
            from urllib.parse import urlparse
            from django.conf import settings

            parsed = urlparse(image_url)
            allowed_hosts = getattr(
                settings,
                "IMAGE_URL_ALLOWED_HOSTS",
                ["res.cloudinary.com", "cloudinary.com"],
            )

            if parsed.scheme == "https" and parsed.hostname and parsed.hostname.lower() in allowed_hosts:
                response = requests.get(image_url, timeout=10, allow_redirects=False)
                if response.status_code == 200:
                    filename = parsed.path.split("/")[-1] or "category_image.jpg"
                    return ContentFile(response.content, name=filename)
        except Exception:
            logger.debug("Category image download failed from %s", image_url)
        return None

    def create(self, validated_data):
        image_url = validated_data.pop("image_url", None)
        if image_url:
            downloaded = self._download_image(image_url)
            if downloaded:
                validated_data["image"] = downloaded
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image_url = validated_data.pop("image_url", None)
        if image_url:
            downloaded = self._download_image(image_url)
            if downloaded:
                validated_data["image"] = downloaded
        return super().update(instance, validated_data)


class AdminProductSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=True, validators=[])
    category_name = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    image_full_url = serializers.SerializerMethodField(read_only=True)
    images = serializers.SerializerMethodField(read_only=True)
    variants = serializers.SerializerMethodField(read_only=True)

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
            "images",
            "gender",
            "age_group",
            "age_range",
            "size_label",
            "status",
            "variants",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_internal_value(self, data):
        if hasattr(data, "copy"):
            mutable_data = data.copy()
        else:
            mutable_data = dict(data)

        # Numeric/URL fields that are genuinely nullable in the DB: turn "" into None.
        nullable_fields = [
            "compare_price",
            "discount_price",
            "image_url",
        ]
        for field_name in nullable_fields:
            if mutable_data.get(field_name) == "":
                mutable_data[field_name] = None

        # CharFields with blank=True but NOT null=True: null/absent must become
        # an empty string, otherwise DRF rejects them as "may not be null".
        blank_char_fields = [
            "brand",
            "age_group",
            "age_range",
            "size_label",
            "sku",
        ]
        for field_name in blank_char_fields:
            if mutable_data.get(field_name) is None:
                mutable_data[field_name] = ""

        return super().to_internal_value(mutable_data)

    def get_category_name(self, obj):
        category = getattr(obj, "category", None)
        return getattr(category, "full_slug", "") or ""

    def get_image_full_url(self, obj):
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
            # Fallback: construct URL manually
            from django.conf import settings

            host = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else "malaikanest.com"
            if host.startswith("http://") or host.startswith("https://"):
                return f"{host}{url}"
            return f"https://{host}{url}"
        return None

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
                        from django.conf import settings

                        host = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else "malaikanest.com"
                        if host.startswith(("http://", "https://")):
                            url = f"{host}{url}"
                        else:
                            url = f"https://{host}{url}"
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

    def _handle_gallery(self, product):
        request = self.context.get("request")
        if not request:
            return

        files = request.FILES.getlist("gallery_images") if request.FILES else []
        if files:
            base = product.images.count()
            for i, f in enumerate(files):
                ProductImage.objects.create(
                    product=product, image=f, position=base + i, is_primary=False
                )

        delete_ids = self._parse_json_list(request.data.get("delete_image_ids"))
        if delete_ids:
            norm = [self._norm_id(x) for x in delete_ids]
            norm = [n for n in norm if n]
            if norm:
                product.images.filter(id__in=norm).delete()

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

        primary_id = self._norm_id(request.data.get("primary_image_id"))
        if primary_id:
            product.images.update(is_primary=False)
            product.images.filter(id=primary_id).update(is_primary=True)

    def get_variants(self, obj):
        request = self.context.get("request")
        variants = obj.variants.filter(is_active=True).select_related("inventory").order_by("color", "size", "id")
        items = []
        for variant in variants:
            image_url = None
            if variant.image:
                raw = variant.image.name if hasattr(variant.image, "name") else str(variant.image)
                if raw.startswith(("http://", "https://")):
                    image_url = raw
                else:
                    image_url = variant.image.url
                    if request and not image_url.startswith(("http://", "https://")):
                        image_url = request.build_absolute_uri(image_url)
            items.append(
                {
                    "id": variant.id,
                    "color": variant.color,
                    "color_label": variant.get_color_display() if variant.color else "",
                    "size": variant.size,
                    "size_label": variant.get_size_display() if variant.size else "",
                    "sku": variant.sku,
                    "price_modifier": str(variant.price_modifier),
                    "stock": getattr(getattr(variant, "inventory", None), "quantity", 0),
                    "available_stock": variant.inventory.available() if hasattr(variant, "inventory") else 0,
                    "image": image_url,
                    "is_active": variant.is_active,
                }
            )
        return items

    def _download_image(self, image_url, default_name):
        if not image_url:
            return None
        try:
            import requests
            from django.core.files.base import ContentFile
            from urllib.parse import urlparse
            from django.conf import settings

            parsed = urlparse(image_url)
            allowed_hosts = getattr(
                settings,
                "IMAGE_URL_ALLOWED_HOSTS",
                ["res.cloudinary.com", "cloudinary.com"],
            )

            if parsed.scheme == "https" and parsed.hostname and parsed.hostname.lower() in allowed_hosts:
                response = requests.get(image_url, timeout=10, allow_redirects=False)
                if response.status_code == 200:
                    filename = parsed.path.split("/")[-1] or default_name
                    return ContentFile(response.content, name=filename)
        except Exception:
            logger.debug("Product image download failed from %s", image_url)
        return None

    @staticmethod
    def _store_image_url(product, url):
        """Persist an absolute image URL verbatim into the image column.

        Assigning a URL string to an ImageField would otherwise trigger the
        configured storage backend (Cloudinary) to re-upload it. Writing the
        raw value via a queryset update bypasses ImageField.pre_save entirely.
        """
        Product.objects.filter(pk=product.pk).update(image=url)
        product.image.name = url

    def _parse_variants(self):
        """Normalize variant payloads coming from JSON or multipart bodies.

        Accepts:

        * Native list/dict (JSON body or DRF JSONParser on multipart with
          nested parts) — each element is already a dict.
        * A JSON string under the "variants" key — legacy multipart shape.
        * A multipart flat "variants[N][field]" map — built into a list of
          dicts grouped by index. Avoids the need to round-trip JSON.
        """
        request = self.context.get("request")
        if not request:
            return None

        data = request.data
        if data is None:
            return None

        # 1) Already a list of dicts — fastest path (JSON body).
        if isinstance(data, list):
            raw = data
        else:
            # 2) "variants" under a single key as JSON string or list.
            raw_variants = data.get("variants") if hasattr(data, "get") else None
            if raw_variants is None:
                # 3) Multipart flat map: variants[0][color], variants[0][size], ...
                raw = self._collect_flat_variants(data)
            elif isinstance(raw_variants, list):
                raw = raw_variants
            elif isinstance(raw_variants, str):
                try:
                    parsed = json.loads(raw_variants)
                except json.JSONDecodeError as exc:
                    raise serializers.ValidationError(
                        {"variants": [f"Variants payload is not valid JSON: {exc}"]}
                    )
                if not isinstance(parsed, list):
                    raise serializers.ValidationError(
                        {"variants": ["Variants payload must be a list."]}
                    )
                raw = parsed
            else:
                raw = []

        if raw is None or raw == [] or raw == "":
            return None

        variants = []
        for index, item in enumerate(raw):
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    {"variants": [f"Variant #{index + 1} is invalid."]}
                )

            color = (item.get("color") or "").strip()
            stock = item.get("stock", 0)
            if not color:
                raise serializers.ValidationError(
                    {"variants": [f"Variant #{index + 1} must include a color."]}
                )

            try:
                stock_value = int(stock or 0)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {"variants": [f"Variant #{index + 1} stock must be a number."]}
                )

            if stock_value < 0:
                raise serializers.ValidationError(
                    {"variants": [f"Variant #{index + 1} stock cannot be negative."]}
                )

            variant_payload = {
                "id": item.get("id"),
                "color": color,
                "size": (item.get("size") or "").strip() or None,
                "sku": (item.get("sku") or "").strip() or None,
                "price_modifier": item.get("price_modifier") or "0",
                "stock": stock_value,
                "is_active": bool(item.get("is_active", True)),
                "image": None,
            }
            variant_payload["image_url"] = (item.get("image_url") or "").strip() or None
            variants.append(variant_payload)

        return variants

    @staticmethod
    def _collect_flat_variants(data):
        """Group 'variants[N][field]' parts from a multipart QueryDict into a list."""
        if not hasattr(data, "lists"):
            return []
        grouped: dict[int, dict[str, str]] = {}
        for raw_key, values in data.lists():
            if not raw_key.startswith("variants"):
                continue
            # Match variants[N][field] or variants[N] (entire item as JSON).
            depth_bracket = raw_key.count("[")
            if depth_bracket < 2:
                continue
            try:
                open_idx = raw_key.index("[")
                close_idx = raw_key.index("]", open_idx)
                n_str = raw_key[open_idx + 1:close_idx]
                idx = int(n_str)
            except (ValueError, IndexError):
                continue
            remainder = raw_key[close_idx + 1:]
            if remainder.startswith("[") and remainder.endswith("]"):
                field = remainder[1:-1]
            else:
                continue
            grouped.setdefault(idx, {})[field] = values[-1] if values else ""
        return [grouped[k] for k in sorted(grouped.keys())]

    def _sync_variants(self, product, variants_payload):
        if variants_payload is None:
            return

        seen_variant_ids = []
        for index, item in enumerate(variants_payload):
            variant_id = item.get("id")
            stock_value = item.pop("stock", 0)
            image = item.pop("image", None)
            image_url = item.pop("image_url", None)

            remote_url = None
            if not image and image_url:
                if image_url.startswith(("http://", "https://")):
                    remote_url = image_url
                else:
                    image = self._download_image(image_url, f"variant_{index + 1}.jpg")

            if variant_id:
                variant = ProductVariant.objects.filter(pk=variant_id, product=product).first()
                if not variant:
                    raise serializers.ValidationError({"variants": [f"Variant #{index + 1} could not be found."]})
                for field, value in item.items():
                    setattr(variant, field, value)
                if image:
                    variant.image = image
                variant.save()
            else:
                variant = ProductVariant.objects.create(
                    product=product,
                    image=image,
                    **item,
                )

            if remote_url:
                ProductVariant.objects.filter(pk=variant.pk).update(image=remote_url)
                variant.image.name = remote_url

            inventory, _ = VariantInventory.objects.get_or_create(
                variant=variant,
                defaults={"quantity": stock_value, "reserved": 0},
            )
            inventory.quantity = max(stock_value, inventory.reserved)
            if inventory.reserved > inventory.quantity:
                inventory.reserved = inventory.quantity
            inventory.save(update_fields=["quantity", "reserved", "updated_at"])
            seen_variant_ids.append(variant.id)

        ProductVariant.objects.filter(product=product).exclude(id__in=seen_variant_ids).update(is_active=False)
        sync_product_stock(product)

    def validate_slug(self, value):
        queryset = Product.objects.filter(slug=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("This slug is already in use.")
        return value

    def create(self, validated_data):
        image_url = validated_data.pop("image_url", None)
        stock = validated_data.get("stock", 0)
        variants_payload = self._parse_variants()

        # A full remote URL (e.g. Cloudinary) is stored verbatim, bypassing the
        # storage backend (see _store_image_url below). Only download when the
        # value is not already an absolute URL.
        remote_url = None
        if image_url:
            if image_url.startswith(("http://", "https://")):
                remote_url = image_url
            else:
                downloaded = self._download_image(image_url, "product_image.jpg")
                if downloaded:
                    validated_data["image"] = downloaded

        try:
            with transaction.atomic():
                product = super().create(validated_data)
                if remote_url:
                    self._store_image_url(product, remote_url)
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
                self._sync_variants(product, variants_payload)
                self._handle_gallery(product)
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
        variants_payload = self._parse_variants()

        # A full remote URL (e.g. Cloudinary) is stored verbatim, bypassing the
        # storage backend. Only download when it is not already an absolute URL.
        remote_url = None
        if image_url:
            if image_url.startswith(("http://", "https://")):
                remote_url = image_url
            else:
                downloaded = self._download_image(image_url, "product_image.jpg")
                if downloaded:
                    validated_data["image"] = downloaded

        previous_stock = instance.stock
        try:
            with transaction.atomic():
                product = super().update(instance, validated_data)
                if remote_url:
                    self._store_image_url(product, remote_url)
                self._sync_variants(product, variants_payload)
                self._handle_gallery(product)
                if "stock" in validated_data:
                    if not product.variants.filter(is_active=True).exists():
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

    def to_internal_value(self, data):
        if hasattr(data, "copy"):
            mutable_data = data.copy()
        else:
            mutable_data = dict(data)

        nullable_fields = [
            "button_link",
            "image_url",
            "mobile_image_url",
            "start_date",
            "end_date",
        ]
        for field_name in nullable_fields:
            if mutable_data.get(field_name) == "":
                mutable_data[field_name] = None

        return super().to_internal_value(mutable_data)

    def get_image_full_url(self, obj):
        if obj.image:
            url = obj.image.url
            if url.startswith("http://") or url.startswith("https://"):
                return url
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(url)
            from django.conf import settings

            host = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else "malaikanest.com"
            if host.startswith("http://") or host.startswith("https://"):
                return f"{host}{url}"
            return f"https://{host}{url}"
        return None

    def get_mobile_image_full_url(self, obj):
        if obj.mobile_image:
            url = obj.mobile_image.url
            if url.startswith("http://") or url.startswith("https://"):
                return url
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(url)
            from django.conf import settings

            host = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else "malaikanest.com"
            if host.startswith("http://") or host.startswith("https://"):
                return f"{host}{url}"
            return f"https://{host}{url}"
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
            "phone_number",
            "is_staff",
            "is_superuser",
            "is_active",
            "is_email_verified",
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
