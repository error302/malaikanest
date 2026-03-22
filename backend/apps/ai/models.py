from django.db import models
from apps.core.models import BaseModel
from django.contrib.auth import get_user_model


User = get_user_model()


class ChatHistory(BaseModel):
    session_id = models.CharField(max_length=100, db_index=True)
    user_email = models.EmailField(blank=True, null=True)
    message = models.TextField()
    response = models.TextField()
    intent = models.CharField(max_length=50, blank=True)
    products_shown = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session_id']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Chat {self.id} - {self.session_id}"


class ProductEmbedding(BaseModel):
    product = models.OneToOneField(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='embedding'
    )
    embedding = models.TextField()

    def __str__(self):
        return f"Embedding for {self.product.name}"

    def get_embedding_array(self):
        return [float(x) for x in self.embedding.split(',')]


class AIGenerationLog(BaseModel):
    GENERATION_TYPES = [
        ('description', 'Product Description'),
        ('seo', 'SEO Metadata'),
        ('bundle', 'Bundle Generation'),
        ('chat', 'Chat Response'),
    ]
    
    generation_type = models.CharField(max_length=20, choices=GENERATION_TYPES)
    input_data = models.JSONField()
    output_data = models.JSONField()
    tokens_used = models.IntegerField(default=0)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['generation_type']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.generation_type} - {self.created_at}"
