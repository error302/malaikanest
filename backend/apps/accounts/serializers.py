from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
import re


def validate_password_strength(password):
    """Validate password meets strength requirements:
    - At least 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    - At least 1 special character
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long.")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least 1 uppercase letter.")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least 1 lowercase letter.")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least 1 number.")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least 1 special character (!@#$%^&* etc.).")
    
    if errors:
        raise serializers.ValidationError({"password": errors})
    
    return password


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'phone', 'first_name', 'last_name', 'role', 'is_staff', 'date_joined')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        error_messages={
            'min_length': 'Password must be at least 8 characters long.',
            'required': 'Password is required.',
        }
    )
    email = serializers.EmailField(
        error_messages={
            'invalid': 'Please enter a valid email address.',
            'required': 'Email is required.',
        }
    )
    phone = serializers.CharField(
        min_length=9,
        max_length=15,
        error_messages={
            'min_length': 'Phone number must be at least 9 digits.',
            'required': 'Phone number is required.',
        }
    )

    class Meta:
        model = User
        fields = ('email', 'phone', 'password', 'first_name', 'last_name')

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_phone(self, value):
        cleaned = re.sub(r'[^\d+]', '', value)
        if len(cleaned) < 9:
            raise serializers.ValidationError("Please enter a valid phone number.")
        return cleaned

    def validate_password(self, value):
        validate_password_strength(value)
        return value

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
