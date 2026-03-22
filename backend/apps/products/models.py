import mimetypes
import os

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from apps.core.models import BaseModel
from django.db.models import Q
from django.utils.text import slugify


def validate_image_file(image):
    """Validate image file type and size."""
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    max_size = 5 * 1024 * 1024  # 5MB

    if image:
        ext = os.path.splitext(image.name)[1].lower()
        if ext not in allowed_extensions:
            raise ValidationError("Unsupported format. Allowed: JPG, PNG, WEBP")

        if image.size > max_size:
            raise ValidationError("Image too large. Maximum size is 5MB")

        mime_type, _ = mimetypes.guess_type(image.name)
        if mime_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise ValidationError("Invalid image format")


class Brand(BaseModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or "brand"
            candidate = base_slug
            counter = 2
            while Brand.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_slug}-{counter}"
                counter += 1
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Category(BaseModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(
        upload_to="categories/",
        blank=True,
        null=True,
        validators=[validate_image_file],
    )
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="children",
        on_delete=models.SET_NULL,
    )
    group = models.CharField(
        max_length=120,
        blank=True,
        help_text="Top-level group for mega menu navigation",
    )

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["group"]),
            models.Index(fields=["parent"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["parent", "slug"], name="uniq_category_parent_slug"
            ),
            models.UniqueConstraint(
                fields=["slug"],
                condition=Q(parent__isnull=True),
                name="uniq_root_category_slug",
            ),
        ]

    def _generate_unique_slug(self, source_value=None):
        base_slug = slugify(source_value or self.slug or self.name) or "category"
        sibling_qs = Category.objects.filter(parent=self.parent).exclude(pk=self.pk)
        candidate = base_slug
        counter = 2
        while sibling_qs.filter(slug=candidate).exists():
            candidate = f"{base_slug}-{counter}"
            counter += 1
        return candidate

    @property
    def root_category(self):
        current = self
        while current.parent_id:
            current = current.parent
        return current

    @property
    def level(self):
        depth = 0
        current = self.parent
        while current:
            depth += 1
            current = current.parent
        return depth

    @property
    def full_slug(self):
        parts = [self.slug]
        current = self.parent
        while current:
            parts.append(current.slug)
            current = current.parent
        return "/".join(reversed([part for part in parts if part]))

    @property
    def breadcrumb(self):
        trail = []
        current = self
        while current:
            trail.append(
                {
                    "name": current.name,
                    "slug": current.slug,
                    "full_slug": current.full_slug,
                }
            )
            current = current.parent
        return list(reversed(trail))

    def descendant_ids(self, include_self=True):
        ids = [self.pk] if include_self and self.pk else []
        for child in self.children.all():
            ids.extend(child.descendant_ids(include_self=True))
        return ids

    def save(self, *args, **kwargs):
        self.slug = self._generate_unique_slug(self.slug or self.name)
        if self.parent is None:
            self.group = self.group or self.name
        else:
            self.group = self.parent.group or self.parent.root_category.name
        super().save(*args, **kwargs)

    @property
    def is_top_level(self):
        return self.parent is None

    def __str__(self):
        return self.name


class Tag(BaseModel):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=120, unique=True, db_index=True, blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or "tag"
            candidate = base_slug
            counter = 2
            while Tag.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_slug}-{counter}"
                counter += 1
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Banner(BaseModel):
    title = models.CharField(max_length=200, blank=True)
    subtitle = models.CharField(max_length=300, blank=True)
    button_text = models.CharField(max_length=50, blank=True)
    button_link = models.URLField(blank=True, null=True)
    image = models.ImageField(upload_to="banners/", validators=[validate_image_file])
    image_url = models.URLField(
        blank=True,
        null=True,
        help_text="Paste Cloudinary URL here instead of uploading",
    )
    mobile_image = models.ImageField(upload_to="banners/", blank=True, null=True)
    mobile_image_url = models.URLField(
        blank=True, null=True, help_text="Paste Cloudinary URL for mobile"
    )
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "-created_at"]

    def __str__(self):
        return self.title or f"Banner {self.pk}"

    @property
    def get_image_url(self):
        if self.image_url:
            return self.image_url
        if self.image:
            return self.image.url
        return None

    @property
    def get_mobile_image_url(self):
        if self.mobile_image_url:
            return self.mobile_image_url
        if self.mobile_image:
            return self.mobile_image.url
        return self.get_image_url


class Product(BaseModel):
    GENDER_CHOICES = [
        ("boy", "Boy"),
        ("girl", "Girl"),
        ("unisex", "Unisex"),
    ]
    AGE_GROUP_CHOICES = [
        ("baby", "Baby (0-2 years)"),
        ("toddler", "Toddler (2-5 years)"),
        ("kids", "Kids (6-12 years)"),
    ]
    AGE_RANGE_CHOICES = [
        ("0-3 months", "0-3 months"),
        ("3-6 months", "3-6 months"),
        ("6-12 months", "6-12 months"),
        ("1-2 years", "1-2 years"),
        ("2-3 years", "2-3 years"),
        ("3-5 years", "3-5 years"),
        ("6-8 years", "6-8 years"),
        ("9-12 years", "9-12 years"),
    ]
    SIZE_CHOICES = [
        ("newborn", "Newborn"),
        ("0-3m", "0-3M"),
        ("3-6m", "3-6M"),
        ("6-12m", "6-12M"),
        ("1y", "1Y"),
        ("2y", "2Y"),
        ("3y", "3Y"),
        ("4y", "4Y"),
        ("5y", "5Y"),
        ("6y", "6Y"),
        ("7y", "7Y"),
        ("8y", "8Y"),
        ("9y", "9Y"),
        ("10y", "10Y"),
        ("11y", "11Y"),
        ("12y", "12Y"),
        ("one-size", "One Size"),
    ]
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
    ]

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True)
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        Category, related_name="products", on_delete=models.PROTECT
    )
    brand = models.ForeignKey(
        "Brand",
        related_name="products",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    discount_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    weight = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True, help_text="Weight in kg"
    )
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default="unisex")
    age_group = models.CharField(max_length=20, blank=True, choices=AGE_GROUP_CHOICES)
    age_range = models.CharField(
        max_length=50,
        blank=True,
        choices=AGE_RANGE_CHOICES,
        help_text="Recommended age range for browsing filters",
    )
    size_label = models.CharField(max_length=20, blank=True, choices=SIZE_CHOICES)
    featured = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    image = models.ImageField(
        upload_to="products/", blank=True, null=True, validators=[validate_image_file]
    )
    is_active = models.BooleanField(default=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name="products")

    class Meta:
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["name"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["is_active", "-created_at"]),
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["price"]),
            models.Index(fields=["featured"]),
            models.Index(fields=["status"]),
            models.Index(fields=["age_group"]),
            models.Index(fields=["age_range"]),
            models.Index(fields=["gender"]),
            models.Index(fields=["size_label"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or "product"
            candidate = base_slug
            counter = 2
            while Product.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_slug}-{counter}"
                counter += 1
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def in_stock(self):
        try:
            return self.inventory.available() > 0
        except Exception:
            return self.stock > 0

    @property
    def available_stock(self):
        try:
            return self.inventory.available()
        except Exception:
            return self.stock

    @property
    def is_low_stock(self):
        try:
            return self.inventory.available() <= self.low_stock_threshold
        except Exception:
            return self.stock <= self.low_stock_threshold

    @property
    def discount_percentage(self):
        if self.compare_price and self.compare_price > self.price:
            return int(((self.compare_price - self.price) / self.compare_price) * 100)
        if self.discount_price and self.discount_price < self.price:
            return int(((self.price - self.discount_price) / self.price) * 100)
        return 0


class Inventory(BaseModel):
    product = models.OneToOneField(
        Product, related_name="inventory", on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField(default=0)
    reserved = models.PositiveIntegerField(default=0)

    def available(self):
        return max(self.quantity - self.reserved, 0)

    def __str__(self):
        return f"{self.product.name} inventory: {self.quantity}"


class ProductVariant(BaseModel):
    SIZE_CHOICES = Product.SIZE_CHOICES
    COLOR_CHOICES = [
        ("white", "White"),
        ("black", "Black"),
        ("gray", "Gray"),
        ("pink", "Pink"),
        ("blue", "Blue"),
        ("green", "Green"),
        ("yellow", "Yellow"),
        ("red", "Red"),
        ("purple", "Purple"),
        ("orange", "Orange"),
        ("brown", "Brown"),
        ("beige", "Beige"),
        ("multi", "Multi"),
    ]

    product = models.ForeignKey(
        Product, related_name="variants", on_delete=models.CASCADE
    )
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, blank=True, null=True)
    color = models.CharField(
        max_length=20, choices=COLOR_CHOICES, blank=True, null=True
    )
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    price_modifier = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("product", "size", "color")
        indexes = [
            models.Index(fields=["product", "size", "color"]),
            models.Index(fields=["sku"]),
        ]

    def __str__(self):
        parts = [self.product.name]
        if self.size:
            parts.append(self.size)
        if self.color:
            parts.append(self.color)
        return " - ".join(parts)


class ProductImage(BaseModel):
    product = models.ForeignKey(
        Product, related_name="images", on_delete=models.CASCADE
    )
    image = models.ImageField(
        upload_to="products/gallery/", validators=[validate_image_file]
    )
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "-created_at"]
        unique_together = ("product", "position")

    def __str__(self):
        return f"{self.product.name} - Image {self.position}"


class VariantInventory(BaseModel):
    variant = models.OneToOneField(
        ProductVariant, related_name="inventory", on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField(default=0)
    reserved = models.PositiveIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["quantity"]),
            models.Index(fields=["variant"]),
        ]

    def available(self):
        return max(self.quantity - self.reserved, 0)

    def __str__(self):
        return f"{self.variant} inventory: {self.quantity}"


class InventoryLog(BaseModel):
    CHANGE_TYPE_CHOICES = [
        ("order_placed", "Order Placed"),
        ("order_cancelled", "Order Cancelled"),
        ("restock", "Restock"),
        ("manual_adjustment", "Manual Adjustment"),
    ]

    product = models.ForeignKey(
        Product, related_name="inventory_logs", on_delete=models.CASCADE
    )
    order = models.ForeignKey(
        "orders.Order",
        related_name="inventory_logs",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    change_type = models.CharField(max_length=30, choices=CHANGE_TYPE_CHOICES)
    quantity_change = models.IntegerField()
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product", "-created_at"]),
            models.Index(fields=["change_type"]),
        ]

    def __str__(self):
        return f"{self.product.name} {self.change_type} {self.quantity_change}"


class Review(BaseModel):
    product = models.ForeignKey(
        Product, related_name="reviews", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviews",
    )
    user_email = models.EmailField(blank=True)
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)

    class Meta:
        unique_together = [("product", "user")]
        indexes = [
            models.Index(fields=["product"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        identifier = self.user.email if self.user else self.user_email
        return f"{self.product.name} review by {identifier}"


class Wishlist(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist",
        null=True,
        blank=True,
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "product")
