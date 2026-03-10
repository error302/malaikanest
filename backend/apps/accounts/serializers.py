from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'phone', 'first_name', 'last_name', 'role', 'is_staff', 'date_joined')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('email', 'phone', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class TokenObtainPairWithUserSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user data in the response - optimized for speed"""
    
    @classmethod
    def get_token(cls, user):
        """Override to create token without additional database queries"""
        token = super().get_token(user)
        # Add claims directly from the user object (already loaded by authenticate)
        token['user_id'] = user.id
        token['email'] = user.email
        token['role'] = getattr(user, 'role', 'customer')
        return token
    
    def validate(self, attrs):
        # Allow login with email instead of username
        email = attrs.get('email')
        username = attrs.get('username')
        
        # If email is provided but username is not, use email as username
        if email and not username:
            attrs['username'] = email
        
        data = super().validate(attrs)
        
        # User is already loaded by authenticate() during token creation
        # Access only pre-fetched fields to avoid additional queries
        user = self.user
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'first_name': getattr(user, 'first_name', ''),
            'last_name': getattr(user, 'last_name', ''),
            'role': getattr(user, 'role', 'customer'),
            'is_staff': user.is_staff,
        }
        
        return data
