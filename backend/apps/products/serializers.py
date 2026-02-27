from rest_framework import serializers
from .models import Category, Product, Inventory, Review, Wishlist
from .models import Banner


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'image')

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()
    stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'description', 'category', 'price', 'image', 'is_active', 'stock')

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
        fields = ('id', 'product', 'quantity', 'reserved')


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ('id', 'product', 'user_email', 'rating', 'title', 'body', 'created_at')


class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = ('id', 'user_email', 'product', 'created_at')


class BannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = ('id', 'title', 'image', 'link', 'is_active', 'position')

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None
