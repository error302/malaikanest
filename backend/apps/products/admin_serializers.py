import json
import logging
import uuid
from copy import copy
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.db.models import Max
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
    validate_image_file,
)


class AdminCategorySerializer(serializers.ModelSerializer):
    full_slug = serializers.CharField(read_only=True)
    path_label = serializers.SerializerMethodField()
    level = serializers.IntegerField(read_only=True)
    image = serializers.ImageField(required=False, allow_null=True, validators=[validate_image_file])
    image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    image_full_url = serializers.SerializerMethodField(read_only=True)
    is_storefront_root = serializers.BooleanField(read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "full_slug",
            "path_label",
            "description",
            "parent",
            "group",
            "image",
            "image_url",
            "image_full_url",
            "is_storefront_root",
            "level",
        ]
        read_only_fields = ["id", "slug", "full_slug", "level"]
        extra_kwargs = {
            "parent": {"required": False, "allow_null": True},
        }

    def get_image_full_url(self, obj):
        url = obj.get_image_url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request and url else url

    def to_representation(self, instance):
        data = super().to_representation(instance)
        custom_url = instance.custom_image_url
        if custom_url != instance.image_url:
            data["image"] = None
        data["image_url"] = custom_url
        return data

    def _download_image(self, image_url):
        if not image_url:
            return None
        from apps.core.utils import safe_download_image
        return safe_download_image(image_url)

    def create(self, validated_data):
        image_url = validated_data.get("image_url")
        if image_url and not validated_data.get("image"):
            downloaded = self._download_image(image_url)
            if downloaded:
                validated_data["image"] = downloaded
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image_url = validated_data.get("image_url")
        if validated_data.get("image"):
            validated_data["image_url"] = ""
        elif image_url:
            downloaded = self._download_image(image_url)
            if downloaded:
                validated_data["image"] = downloaded
        return super().update(instance, validated_data)


    def get_path_label(self, obj):
        return " › ".join(part["name"] for part in obj.breadcrumb)


class AdminProductSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=True, validators=[])
    category_name = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True, validators=[validate_image_file])
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
            "fabric",
            "whats_included",
            "size_guide",
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
            "condition",
            "age_group",
            "age_range",
            "size_label",
            "status",
            "variants",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data["variants"]:
            variants = [variant for variant in data["variants"] if variant["is_active"]]
            available = sum(variant["available_stock"] for variant in variants)
            data["available_stock"] = available
            data["reserved_stock"] = sum(variant["stock"] for variant in variants) - available
        else:
            inventory = getattr(instance, "inventory", None)
            data["available_stock"] = inventory.available() if inventory else instance.stock
            data["reserved_stock"] = inventory.reserved if inventory else 0
        return data

    def to_internal_value(self, data):
        if not hasattr(data, "get"):
            return super().to_internal_value(data)
        # QueryDict.copy() deep-copies files, which breaks disk-backed uploads.
        mutable_data = copy(data)

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
            "age_group",
            "age_range",
            "size_label",
            "fabric",
            "whats_included",
            "size_guide",
        ]
        for field_name in blank_char_fields:
            if field_name in mutable_data and mutable_data[field_name] is None:
                mutable_data[field_name] = ""

        return super().to_internal_value(mutable_data)

    def get_category_name(self, obj):
        category = getattr(obj, "category", None)
        return getattr(category, "full_slug", "") or ""

    def get_image_full_url(self, obj):
        if obj.image_url:
            return obj.image_url
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
            url = img.get_image_url
            if not url:
                continue
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
                "variant_id": img.variant_id,
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
        for file in files:
            serializers.ImageField(validators=[validate_image_file]).run_validation(file)
            file.seek(0)
        if files:
            last_position = product.images.aggregate(last=Max("position"))["last"]
            base = last_position + 1 if last_position is not None else 0
            for i, f in enumerate(files):
                ProductImage.objects.create(
                    product=product, image=f, position=base + i, is_primary=False
                )

        add_urls = self._parse_json_list(request.data.get("gallery_image_urls"))
        single_url = request.data.get("add_gallery_url")
        if single_url and single_url not in add_urls:
            add_urls.append(single_url)
        if add_urls:
            url_field = serializers.URLField(max_length=500)
            add_urls = [url_field.run_validation(url) for url in add_urls]
            last_position = product.images.aggregate(last=Max("position"))["last"]
            base = (last_position + 1) if last_position is not None else 0
            for i, u in enumerate(add_urls):
                if u and isinstance(u, str) and u.startswith(("http://", "https://")):
                    ProductImage.objects.create(
                        product=product, image_url=u, position=base + i, is_primary=False
                    )

        photo_details = request.data.get("photo_details")
        if photo_details is not None:
            if not isinstance(photo_details, dict):
                raise serializers.ValidationError({"photo_details": "Invalid photo details."})
            photo_id = self._norm_id(photo_details.get("id"))
            photo = product.images.filter(pk=photo_id).first()
            if not photo:
                raise serializers.ValidationError({"photo_details": "Choose a photo from this product."})
            variant_id = photo_details.get("variant_id")
            if variant_id:
                variant_id = self._norm_id(variant_id)
                if not variant_id or not product.variants.filter(pk=variant_id).exists():
                    raise serializers.ValidationError({"photo_details": "Choose a variant from this product."})
            caption = serializers.CharField(max_length=200, allow_blank=True).run_validation(
                photo_details.get("alt_text", ""),
            )
            product.images.filter(pk=photo.pk).update(alt_text=caption, variant_id=variant_id or None)

        delete_ids = self._parse_json_list(request.data.get("delete_image_ids"))
        if delete_ids:
            norm = [self._norm_id(x) for x in delete_ids]
            norm = [n for n in norm if n]
            if norm:
                deleted = product.images.filter(id__in=norm)
                if deleted.filter(is_primary=True).exists() or (
                    product.image and deleted.filter(image=product.image.name).exists()
                ) or (
                    product.image_url and deleted.filter(image_url=product.image_url).exists()
                ):
                    Product.objects.filter(pk=product.pk).update(image="", image_url="")
                    product.image.name = ""
                    product.image_url = ""
                deleted.delete()

        order = self._parse_json_list(request.data.get("image_orders"))
        if order:
            imgs = {str(img.id): img for img in product.images.all()}
            ordered_ids = list(dict.fromkeys(self._norm_id(pid) for pid in order))
            ordered = [imgs[pid] for pid in ordered_ids if pid in imgs]
            ordered.extend(img for pid, img in imgs.items() if pid not in ordered_ids)
            base = max((img.position for img in ordered), default=0) + 1
            if base + len(ordered) > 32767:
                raise serializers.ValidationError({"image_orders": ["Too many photo positions to reorder."]})
            for i, img in enumerate(ordered):
                img.position = base + i
            if ordered:
                ProductImage.objects.bulk_update(ordered, ["position"])
            for i, img in enumerate(ordered):
                img.position = i
            if ordered:
                ProductImage.objects.bulk_update(ordered, ["position"])

        if "image" in request.data:
            product.images.update(is_primary=False)
        if "primary_image_id" in request.data:
            primary_id = self._norm_id(request.data.get("primary_image_id"))
            primary = product.images.filter(id=primary_id).first() if primary_id else None
            if not primary:
                raise serializers.ValidationError({"primary_image_id": ["Select an existing photo for this product."]})
            product.images.update(is_primary=False)
            product.images.filter(id=primary_id).update(is_primary=True)
            stored_file = primary.image.name or ""
            stored_url = primary.image_url or ""
            Product.objects.filter(pk=product.pk).update(image=stored_file, image_url=stored_url)
            product.image.name = stored_file
            product.image_url = stored_url

    def get_variants(self, obj):
        request = self.context.get("request")
        variants = obj.variants.all().select_related("inventory").order_by("color", "size", "id")
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
            from django.conf import settings as dj_settings
            from urllib.parse import urlparse

            parsed = urlparse(image_url)
            # SSRF guard: HTTPS only, allowlisted hosts, no redirects — same
            # policy as the invoice fetcher in orders/views.py.
            if parsed.scheme != "https":
                logger.warning("Rejected non-https image URL: %s", image_url)
                return None
            allowed = set(getattr(dj_settings, "INVOICE_URL_ALLOWED_HOSTS", []) or [])
            if not allowed or parsed.hostname not in allowed:
                logger.warning("Rejected image URL from non-allowlisted host: %s", image_url)
                return None

            response = requests.get(image_url, timeout=10, allow_redirects=False)
            if response.status_code == 200:
                filename = parsed.path.split("/")[-1] or default_name
                return ContentFile(response.content, name=filename)
        except Exception:
            logger.debug("Product image download failed from %s", image_url)
        return None

    @staticmethod
    def _store_image_url(product, url):
        """Persist an absolute image URL verbatim into image and image_url columns.

        Assigning a URL string to an ImageField would otherwise trigger the
        configured storage backend (Cloudinary) to re-upload it. Writing the
        raw value via a queryset update bypasses ImageField.pre_save entirely.
        """
        Product.objects.filter(pk=product.pk).update(image=url, image_url=url)
        product.image.name = url
        product.image_url = url

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
                if not raw:
                    return None
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
                raise serializers.ValidationError({"variants": ["Variants payload must be a list."]})

        variants = []
        seen = set()
        seen_ids = set()
        for index, item in enumerate(raw):
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    {"variants": [f"Variant #{index + 1} is invalid."]}
                )

            try:
                color = serializers.ChoiceField(choices=ProductVariant.COLOR_CHOICES, allow_null=True, allow_blank=True).run_validation(item.get("color")) or None
                size = serializers.ChoiceField(choices=ProductVariant.SIZE_CHOICES, allow_null=True, allow_blank=True).run_validation(item.get("size")) or None
                stock_value = serializers.IntegerField(min_value=0).run_validation(item.get("stock", 0))
                active = serializers.BooleanField().run_validation(item.get("is_active", True))
                modifier = serializers.DecimalField(max_digits=10, decimal_places=2).run_validation(item.get("price_modifier") or "0")
                variant_id = serializers.UUIDField(allow_null=True).run_validation(item.get("id"))
                sku = serializers.CharField(max_length=100, allow_blank=True, allow_null=True).run_validation(item.get("sku")) or None
            except serializers.ValidationError as exc:
                raise serializers.ValidationError({"variants": [f"Variant #{index + 1}: {exc.detail}"]})
            key = (size, color)
            if key in seen or (variant_id and variant_id in seen_ids):
                raise serializers.ValidationError({"variants": [f"Variant #{index + 1} duplicates an existing row."]})
            seen.add(key)
            if variant_id:
                seen_ids.add(variant_id)

            variant_payload = {
                "id": variant_id,
                "color": color,
                "size": size,
                "sku": sku,
                "price_modifier": modifier,
                "stock": stock_value,
                "is_active": active,
                "image": None,
            }
            if "sku" not in item:
                variant_payload.pop("sku")
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
        base_price = Decimal(str(product.price))
        if any(base_price + variant["price_modifier"] < 0 for variant in variants_payload):
            raise serializers.ValidationError({"variants": ["A variant price cannot be less than KES 0."]})

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
        if product.variants.filter(is_active=True).exists():
            sync_product_stock(product)
        else:
            Product.objects.filter(pk=product.pk).update(stock=0)
            Inventory.objects.update_or_create(product=product, defaults={"quantity": 0, "reserved": 0})
        product.stock = Product.objects.get(pk=product.pk).stock

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
        if "image" in validated_data:
            validated_data["image_url"] = ""
        elif image_url:
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
                    product.images.update(is_primary=False)
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
        if obj.image_url:
            return obj.image_url
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
        if obj.mobile_image_url:
            return obj.mobile_image_url
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
