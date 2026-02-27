from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat, name='ai-chat'),
    path('search/', views.search_products, name='ai-search'),
    path('recommendations/', views.product_recommendations, name='ai-recommendations'),
    path('bundle/generate/', views.generate_bundle, name='ai-bundle-generate'),
    path('bundle/suggestions/', views.bundle_suggestions, name='ai-bundle-suggestions'),
    path('description/generate/', views.generate_description, name='ai-description'),
    path('description/bulk/', views.bulk_generate_descriptions, name='ai-description-bulk'),
    path('seo/generate/', views.generate_seo, name='ai-seo'),
    path('embeddings/index/', views.index_embeddings, name='ai-embeddings-index'),
]
