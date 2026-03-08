from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)


class UserManager(BaseUserManager):
    def create_user(self, email, phone, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        if not phone:
            raise ValueError("Users must have a phone number")
        email = self.normalize_email(email)
        user = self.model(email=email, phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        return self.create_user(email, phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (("admin", "Admin"), ("customer", "Customer"))
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")
    date_joined = models.DateTimeField(auto_now_add=True)
    password_reset_token = models.CharField(max_length=32, blank=True, null=True)
    password_reset_expires = models.DateTimeField(blank=True, null=True)
    verification_token = models.CharField(max_length=64, blank=True, null=True)
    # MED-04: Added expiry for email verification tokens (was missing, tokens never expired)
    verification_token_expires = models.DateTimeField(blank=True, null=True)
    email_verified = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["phone"]

    class Meta:
        db_table = "accounts_user"
        indexes = [models.Index(fields=["email"]), models.Index(fields=["phone"])]

    def __str__(self):
        return self.email


class UserAddress(models.Model):
    LABEL_CHOICES = [
        ('home', 'Home'),
        ('work', 'Work'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(
        User, 
        related_name='addresses', 
        on_delete=models.CASCADE
    )
    label = models.CharField(max_length=20, choices=LABEL_CHOICES, default='home')
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    county = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f'{self.label} - {self.street}, {self.city}'

