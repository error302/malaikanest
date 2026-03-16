from rest_framework import serializers

from .models import SiteSettings


class SiteSettingsSerializer(serializers.ModelSerializer):
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
            "logo",
            "logo_url",
            "updated_at",
        )
        read_only_fields = ("logo_url", "updated_at")

    def get_logo_url(self, obj: SiteSettings):
        if not obj.logo:
            return None
        url = obj.logo.url
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
        if not obj.logo:
            return None
        url = obj.logo.url
        if url.startswith("http://") or url.startswith("https://"):
            return url
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(url)
        return url

