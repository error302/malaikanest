from django.db import models
from django.utils.text import slugify
from cloudinary.models import CloudinaryField


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    image = CloudinaryField('image', blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Banner(models.Model):
    title = models.CharField(max_length=200, blank=True)
    image = CloudinaryField('image')
    link = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    position = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position', '-created_at']

    def __str__(self):
        return self.title or f"Banner {self.pk}"


class Product(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    image = CloudinaryField('image', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['name']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['is_active', '-created_at']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['price']),
        ]

    def __str__(self):
        return self.name


class Inventory(models.Model):
    product = models.OneToOneField(Product, related_name='inventory', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    reserved = models.PositiveIntegerField(default=0)

    def available(self):
        return max(self.quantity - self.reserved, 0)

    def __str__(self):
        return f"{self.product.name} inventory: {self.quantity}"


class ProductVariant(models.Model):
    SIZE_CHOICES = [
        ('0-3m', '0-3 Months'),
        ('3-6m', '3-6 Months'),
        ('6-9m', '6-9 Months'),
        ('9-12m', '9-12 Months'),
        ('12-18m', '12-18 Months'),
        ('18-24m', '18-24 Months'),
        ('2-3y', '2-3 Years'),
        ('3-4y', '3-4 Years'),
        ('4-5y', '4-5 Years'),
        ('one-size', 'One Size'),
    ]
    
    COLOR_CHOICES = [
        ('white', 'White'),
        ('black', 'Black'),
        ('gray', 'Gray'),
        ('pink', 'Pink'),
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('yellow', 'Yellow'),
        ('red', 'Red'),
        ('purple', 'Purple'),
        ('orange', 'Orange'),
        ('brown', 'Brown'),
        ('beige', 'Beige'),
        ('multi', 'Multi'),
    ]
    
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE)
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, blank=True, null=True)
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, blank=True, null=True)
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    price_modifier = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('product', 'size', 'color')
        indexes = [
            models.Index(fields=['product', 'size', 'color']),
            models.Index(fields=['sku']),
        ]

    def __str__(self):
        parts = [self.product.name]
        if self.size:
            parts.append(self.size)
        if self.color:
            parts.append(self.color)
        return ' - '.join(parts)


class Review(models.Model):
    product = models.ForeignKey(Product, related_name='reviews', on_delete=models.CASCADE)
    user_email = models.EmailField()
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['product']), models.Index(fields=['-created_at'])]

    def __str__(self):
        return f"{self.product.name} review by {self.user_email}"


class Wishlist(models.Model):
    user_email = models.EmailField()
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user_email', 'product')
