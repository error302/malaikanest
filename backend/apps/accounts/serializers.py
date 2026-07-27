from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
import re


def validate_password_strength(password):
    """Validate password meets strength requirements:
    - At least 8 characters
    - Must contain at least one letter and one digit
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long.")
    
    if not re.search(r'[a-zA-Z]', password):
        errors.append("Password must contain at least 1 letter.")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least 1 number.")
    
    if errors:
        raise serializers.ValidationError(errors)
    
    return password


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "phone_number",
            "full_name",
            "first_name",
            "last_name",
            "role",
            "is_staff",
            "is_email_verified",
            "date_joined",
        )
        # SECURITY: privilege/identity fields are read-only. Without this, the
        # ProfileView (RetrieveUpdateAPIView) lets any authenticated user
        # PATCH {"is_staff": true, "role": "ADMIN"} to self-promote. Changing
        # these must go through the admin-only AdminUserViewSet actions.
        read_only_fields = (
            "id",
            "role",
            "is_staff",
            "is_email_verified",
            "date_joined",
        )


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
    phone_number = serializers.CharField(
        min_length=9,
        max_length=15,
        error_messages={
            'min_length': 'Phone number must be at least 9 digits.',
            'required': 'Phone number is required.',
        }
    )

    class Meta:
        model = User
        fields = ("email", "phone_number", "password", "first_name", "last_name", "full_name")

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_phone_number(self, value):
        from .models import normalize_kenyan_phone
        cleaned = normalize_kenyan_phone(value)
        if User.objects.filter(phone_number=cleaned).exists():
            raise serializers.ValidationError("An account with this phone number already exists.")
        if not re.match(r"^\+254[71]\d{8}$", cleaned):
            raise serializers.ValidationError("Phone number must be a valid Kenyan mobile number (e.g. 0712345678 or 0112345678).")
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
        # Token version enables revocation on password change / logout-everywhere.
        token['token_version'] = user.token_version
        return token
    
    def validate(self, attrs):
        email = (attrs.get('email') or attrs.get('username') or '').strip().lower()
        if email:
            user = User.objects.filter(email=email).only('is_active').first()
            if user and not user.is_active:
                raise AuthenticationFailed('Please verify your email before signing in.')

        data = super().validate(attrs)
        
        # User is already loaded by authenticate() during token creation
        # Access only pre-fetched fields to avoid additional queries
        user = self.user
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'phone_number': getattr(user, 'phone_number', ''),
            'full_name': getattr(user, 'full_name', ''),
            'first_name': getattr(user, 'first_name', ''),
            'last_name': getattr(user, 'last_name', ''),
            'role': getattr(user, 'role', User.ROLE_CUSTOMER),
            'is_staff': user.is_staff,
        }
        
        return data
