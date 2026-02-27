from rest_framework import serializers
from .models import Category, Product, Inventory, Review, Wishlist
from .models import Banner


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    is_top_level = serializers.BooleanField(read_only=True)
    group = serializers.CharField(read_only=True)

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "image",
            "parent",
            "children",
            "is_top_level",
            "group",
        )

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def get_children(self, obj):
        children = obj.children.all()
        return CategorySerializer(children, many=True).data if children else []


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()
    stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "category",
            "price",
            "image",
            "is_active",
            "stock",
        )

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def get_stock(self, obj):
        try:
            return obj.inventory.quantity - obj.inventory.reserved
        except:
            return 0


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ("id", "product", "quantity", "reserved")


class ReviewSerializer(serializers.ModelSerializer):
    user_email_masked = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            "id",
            "product",
            "user_email",
            "user_email_masked",
            "rating",
            "title",
            "body",
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


class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = ("id", "user_email", "product", "created_at")


class BannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = ("id", "title", "image", "link", "is_active", "position")

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None
