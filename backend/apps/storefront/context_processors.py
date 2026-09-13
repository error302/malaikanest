from apps.core.models import SiteSettings
from apps.orders.models import Cart
from apps.products.models import Category


def storefront_context(request):
    """Global context for Malaika Nest storefront templates."""
    categories = Category.objects.filter(parent__isnull=True).order_by("name")[:10]
    
    # Calculate cart count
    cart_count = 0
    cart = None
    if request.user.is_authenticated:
        cart = Cart.objects.filter(user=request.user).first()
    elif request.session.session_key:
        cart = Cart.objects.filter(session_key=request.session.session_key).first()

    if cart:
        cart_count = sum(item.quantity for item in cart.items.all())

    site_settings = SiteSettings.get_solo()

    return {
        "nav_categories": categories,
        "cart_count": cart_count,
        "cart": cart,
        "site_settings": site_settings,
        "whatsapp_phone": "+254726771321",
        "whatsapp_url": "https://wa.me/254726771321?text=Hello%20Malaika%20Nest%2C%20I%20have%20an%20inquiry",
    }
