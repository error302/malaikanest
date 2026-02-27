from django.contrib import admin
from .models import ChatHistory, ProductEmbedding, AIGenerationLog


@admin.register(ChatHistory)
class ChatHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'session_id', 'user_email', 'intent', 'created_at']
    list_filter = ['intent', 'created_at']
    search_fields = ['session_id', 'user_email', 'message']
    readonly_fields = ['session_id', 'user_email', 'message', 'response', 'intent', 'products_shown', 'created_at']


@admin.register(ProductEmbedding)
class ProductEmbeddingAdmin(admin.ModelAdmin):
    list_display = ['product', 'created_at', 'updated_at']
    search_fields = ['product__name']
    readonly_fields = ['product', 'embedding', 'created_at', 'updated_at']


@admin.register(AIGenerationLog)
class AIGenerationLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'generation_type', 'success', 'tokens_used', 'created_at']
    list_filter = ['generation_type', 'success', 'created_at']
    search_fields = ['input_data', 'output_data']
    readonly_fields = ['generation_type', 'input_data', 'output_data', 'tokens_used', 'success', 'error_message', 'created_at']
