from rest_framework import serializers

from .models import SiteSettings, ShopPhoto


class SiteSettingsSerializer(serializers.ModelSerializer):
    logo_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    logo_full_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SiteSettings
        fields = (
            "site_name",
            "site_description",
            "contact_email",
            "contact_phone",
            "address",
            "facebook_url",
            "instagram_url",
            "twitter_url",
            "shipping_fee",
            "free_shipping_threshold",
            "minimum_order_amount",
            "logo",
            "logo_url",
            "logo_full_url",
            "updated_at",
        )
        read_only_fields = ("logo_full_url", "updated_at")

    def get_logo_full_url(self, obj: SiteSettings):
        return obj.get_logo_url


class ShopPhotoSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ShopPhoto
        fields = ("id", "image", "caption", "created_at")
        read_only_fields = fields

    def get_image(self, obj: ShopPhoto):
        if not obj.image:
            return None
        url = obj.image.url
        if url.startswith("http://") or url.startswith("https://"):
            return url
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(url)
        return url


class PublicSiteSettingsSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = SiteSettings
        fields = (
            "site_name",
            "site_description",
            "contact_email",
            "contact_phone",
            "address",
            "facebook_url",
            "instagram_url",
            "twitter_url",
            "shipping_fee",
            "free_shipping_threshold",
            "minimum_order_amount",
            "logo_url",
            "updated_at",
        )
        read_only_fields = fields

    def get_logo_url(self, obj: SiteSettings):
        if obj.logo_url:
            return obj.logo_url
        if not obj.logo:
            return None
        url = obj.logo.url
        if url.startswith("http://") or url.startswith("https://"):
            return url
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(url)
        return url

