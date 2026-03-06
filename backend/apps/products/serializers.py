from rest_framework import serializers
from .models import Category, Product, Inventory, Review, Wishlist, Brand
from .models import Banner


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
    brand = BrandSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()

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
            "discount_price",
            "discount_percentage",
            "stock",
            "low_stock_threshold",
            "in_stock",
            "weight",
            "gender",
            "age_range",
            "featured",
            "status",
            "seo_title",
            "seo_description",
            "image",
            "is_active",
            "created_at",
            "updated_at",
        )

    def create(self, validated_data):
        # Handle the custom multipart field from Next.js Dropzone
        request = self.context.get('request')
        image = None
        if request and request.FILES:
            # We take the first image if multiple were uploaded
            files = request.FILES.getlist('uploaded_images')
            if files:
                image = files[0]

        product = Product.objects.create(**validated_data)
        if image:
            product.image = image
            product.save()
            
        return product

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()
    discount_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "price",
            "discount_price",
            "discount_percentage",
            "stock",
            "featured",
            "status",
            "image",
            "is_active",
        )

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None


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
        fields = ("id", "user", "product", "created_at")
        read_only_fields = ("user",)


class BannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = (
            "id",
            "title",
            "subtitle",
            "button_text",
            "button_link",
            "image",
            "is_active",
            "position",
            "start_date",
            "end_date",
        )

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None


