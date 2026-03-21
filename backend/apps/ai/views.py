from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
import uuid

from .services import chatbot, embeddings, recommendations, bundles, admin_tools


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def chat(request):
    message = request.data.get('message', '')
    session_id = request.data.get('session_id', str(uuid.uuid4()))
    user_email = request.data.get('email')
    
    if not message:
        return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    result = chatbot.process_message(message, session_id)
    
    return Response({
        'session_id': session_id,
        'response': result.get('ai_response', ''),
        'intent': result.get('intent', 'general'),
        'products': result.get('products', []),
    })


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def search_products(request):
    query = request.query_params.get('q', '')
    limit = int(request.query_params.get('limit', 10))
    
    if not query:
        return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    results = embeddings.search_similar_products(query, limit=limit)
    
    return Response({
        'query': query,
        'results': results,
        'count': len(results)
    })


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def product_recommendations(request):
    product_id = request.query_params.get('product_id')
    user_email = request.query_params.get('email')
    limit = int(request.query_params.get('limit', 5))
    
    if product_id:
        from apps.products.models import Product
        try:
            product = Product.objects.get(id=product_id)
            recs = recommendations.get_related_products(product, limit=limit)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    elif user_email:
        recs = recommendations.get_personalized_recommendations(user_email, limit=limit)
    else:
        recs = recommendations.get_trending_products(limit=limit)
    
    return Response({
        'recommendations': recs,
        'count': len(recs)
    })


@csrf_exempt
@api_view(['POST'])
def generate_bundle(request):
    bundle_type = request.data.get('type', 'newborn_starter')
    budget = request.data.get('budget')
    age_group = request.data.get('age_group', 'newborn')
    gender = request.data.get('gender')
    climate = request.data.get('climate', 'warm')
    
    result = bundles.generate_bundle(
        bundle_type=bundle_type,
        budget=budget,
        age_group=age_group,
        gender=gender,
        climate=climate
    )
    
    return Response(result)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def bundle_suggestions(request):
    budget = request.query_params.get('budget')
    age_group = request.query_params.get('age_group', 'newborn')
    
    budget = int(budget) if budget else None
    suggestions = bundles.get_bundle_suggestions(budget=budget, age_group=age_group)
    
    return Response({
        'suggestions': suggestions,
        'count': len(suggestions)
    })


@csrf_exempt
@api_view(['POST'])
def generate_description(request):
    product_id = request.data.get('product_id')
    
    if not product_id:
        return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    from apps.products.models import Product
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    description = admin_tools.generate_product_description(product)
    
    return Response({
        'product_id': product_id,
        'description': description
    })


@csrf_exempt
@api_view(['POST'])
def bulk_generate_descriptions(request):
    category_id = request.data.get('category_id')
    limit = int(request.data.get('limit', 20))
    
    results = admin_tools.bulk_generate_descriptions(
        category_id=category_id,
        limit=limit
    )
    
    return Response(results)


@csrf_exempt
@api_view(['POST'])
def generate_seo(request):
    product_id = request.data.get('product_id')
    
    if not product_id:
        return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    from apps.products.models import Product
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    seo_data = admin_tools.generate_seo_metadata(product)
    
    return Response({
        'product_id': product_id,
        **seo_data
    })


@csrf_exempt
@api_view(['POST'])
def index_embeddings(request):
    limit = int(request.data.get('limit', 100))
    count = embeddings.index_all_products(limit=limit)
    
    return Response({
        'indexed': count,
        'message': f'Successfully indexed {count} products'
    })
