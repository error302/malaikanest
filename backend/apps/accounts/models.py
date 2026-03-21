from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _


KENYAN_PHONE_VALIDATOR = RegexValidator(
    regex=r"^\+2547\d{8}$",
    message=_("Phone number must be in Kenyan format: +2547XXXXXXXX."),
)


def normalize_kenyan_phone(value: str) -> str:
    if value is None:
        return ""
    raw = str(value).strip()
    raw = raw.replace(" ", "").replace("-", "")
    if raw.startswith("0") and len(raw) == 10:
        raw = "+254" + raw[1:]
    elif raw.startswith("254") and len(raw) == 12:
        raw = "+" + raw
    elif raw.startswith("+254") and len(raw) == 13:
        pass
    elif raw.startswith("7") and len(raw) == 9:
        raw = "+254" + raw
    return raw


class UserManager(BaseUserManager):
    def create_user(self, email, phone_number, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        if not phone_number:
            raise ValueError("Users must have a phone number")
        email = self.normalize_email(email)
        phone_number = normalize_kenyan_phone(phone_number)
        user = self.model(email=email, phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, phone_number, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.ROLE_ADMIN)
        return self.create_user(email, phone_number, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_ADMIN = "ADMIN"
    ROLE_CUSTOMER = "CUSTOMER"
    ROLE_CHOICES = (
        (ROLE_ADMIN, "Admin"),
        (ROLE_CUSTOMER, "Customer"),
    )
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=20,
        unique=True,
        validators=[KENYAN_PHONE_VALIDATOR],
        help_text=_("Kenyan format: +2547XXXXXXXX"),
    )
    full_name = models.CharField(max_length=255, blank=True, default="")
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CUSTOMER)
    date_joined = models.DateTimeField(auto_now_add=True)
    password_reset_token = models.CharField(max_length=32, blank=True, null=True)
    password_reset_expires = models.DateTimeField(blank=True, null=True)
    verification_token = models.CharField(max_length=64, blank=True, null=True)
    # MED-04: Added expiry for email verification tokens (was missing, tokens never expired)
    verification_token_expires = models.DateTimeField(blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["phone_number"]

    class Meta:
        db_table = "accounts_user"
        indexes = [models.Index(fields=["email"]), models.Index(fields=["phone_number"])]

    def clean(self):
        super().clean()
        if self.email:
            self.email = self.email.strip().lower()
        if self.phone_number:
            self.phone_number = normalize_kenyan_phone(self.phone_number)

    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.full_name:
            self.full_name = f"{self.first_name or ''} {self.last_name or ''}".strip()
        super().save(*args, **kwargs)

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
