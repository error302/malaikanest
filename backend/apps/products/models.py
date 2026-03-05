from django.db import models
from django.utils.text import slugify
from django.conf import settings


class Brand(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="children",
        on_delete=models.SET_NULL,
    )
    group = models.CharField(
        max_length=120, blank=True, help_text="Top-level group for mega menu navigation"
    )

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        if self.parent is None and not self.group:
            self.group = self.name
        super().save(*args, **kwargs)

    @property
    def is_top_level(self):
        return self.parent is None

    def __str__(self):
        return self.name


class Banner(models.Model):
    title = models.CharField(max_length=200, blank=True)
    subtitle = models.CharField(max_length=300, blank=True)
    button_text = models.CharField(max_length=50, blank=True)
    button_link = models.URLField(blank=True, null=True)
    image = models.ImageField(upload_to='banners/')
    mobile_image = models.ImageField(upload_to='banners/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    position = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "-created_at"]

    def __str__(self):
        return self.title or f"Banner {self.pk}"


class Product(models.Model):
    GENDER_CHOICES = [
        ("boy", "Boy"),
        ("girl", "Girl"),
        ("unisex", "Unisex"),
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
    discount_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    weight = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True, help_text="Weight in kg"
    )
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default="unisex")
    age_range = models.CharField(
        max_length=50, blank=True, help_text="e.g., 0-3 months, 1-2 years"
    )
    featured = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=160, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

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
        ]


    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def in_stock(self):
        """
        LOW-02: Read from Inventory.available() instead of Product.stock
        to eliminate the dual-source-of-truth problem. Product.stock is kept
        for backward compatibility but the canonical source is the Inventory model.
        """
        try:
            return self.inventory.available() > 0
        except Exception:
            return self.stock > 0

    @property
    def available_stock(self):
        """Canonical available stock from Inventory model."""
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
        if self.discount_price and self.discount_price < self.price:
            return int(((self.price - self.discount_price) / self.price) * 100)
        return 0


class Inventory(models.Model):
    product = models.OneToOneField(
        Product, related_name="inventory", on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField(default=0)
    reserved = models.PositiveIntegerField(default=0)

    def available(self):
        return max(self.quantity - self.reserved, 0)

    def __str__(self):
        return f"{self.product.name} inventory: {self.quantity}"


class ProductVariant(models.Model):
    SIZE_CHOICES = [
        ("0-3m", "0-3 Months"),
        ("3-6m", "3-6 Months"),
        ("6-9m", "6-9 Months"),
        ("9-12m", "9-12 Months"),
        ("12-18m", "12-18 Months"),
        ("18-24m", "18-24 Months"),
        ("2-3y", "2-3 Years"),
        ("3-4y", "3-4 Years"),
        ("4-5y", "4-5 Years"),
        ("one-size", "One Size"),
    ]

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


class Review(models.Model):
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
    # Keep user_email for legacy/guest reviews
    user_email = models.EmailField(blank=True)
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # MED-07: Added unique_together to prevent duplicate reviews per user per product
        unique_together = [('product', 'user')]
        indexes = [
            models.Index(fields=["product"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        identifier = self.user.email if self.user else self.user_email
        return f"{self.product.name} review by {identifier}"


class Wishlist(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist",
        null=True,
        blank=True,
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "product")
