from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from django.conf import settings
from django.core.mail import send_mail
import logging

logger = logging.getLogger("apps.core")


class ContactFormThrottle(AnonRateThrottle):
    rate = "5/hour"
    scope = "contact_form"


class ContactFormView(APIView):
    """Receive contact form submissions and email them to the store owner."""
    permission_classes = [AllowAny]
    throttle_classes = [ContactFormThrottle]

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip()
        phone = (request.data.get("phone") or "").strip()
        subject = (request.data.get("subject") or "Contact Form").strip()
        message = (request.data.get("message") or "").strip()

        if not name or not email or not message:
            return Response(
                {"detail": "Name, email, and message are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        recipient = getattr(settings, "DEFAULT_FROM_EMAIL", "malaikanest7@gmail.com")
        # Extract plain address if it has display name format
        if "<" in recipient and ">" in recipient:
            recipient = recipient.split("<")[1].rstrip(">").strip()

        body = (
            f"New message from your Malaika Nest contact form\n"
            f"{'=' * 50}\n\n"
            f"Name:    {name}\n"
            f"Email:   {email}\n"
            f"Phone:   {phone or 'Not provided'}\n"
            f"Subject: {subject}\n\n"
            f"Message:\n{message}\n\n"
            f"{'=' * 50}\n"
            f"Reply directly to: {email}"
        )

        try:
            send_mail(
                subject=f"[Malaika Nest] {subject}",
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            logger.info("Contact form email sent from %s (%s)", email, name)
            return Response({"detail": "Message sent successfully."}, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.error("Contact form email failed: %s", exc)
            return Response(
                {"detail": "Failed to send message. Please try again or contact us directly."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )




# Default settings (fallback when database settings don't exist)
DEFAULT_SETTINGS = {
    'site_name': 'Malaika Nest',
    'site_description': 'Premium Baby Products in Kenya',
    'contact_email': 'malaikanest7@gmail.com',
    'contact_phone': '+254700000000',
    'address': 'Nairobi, Kenya',
    'facebook_url': '',
    'instagram_url': '',
    'twitter_url': '',
    'shipping_fee': '500',
    'free_shipping_threshold': '5000',
    'minimum_order_amount': '1000',
}


class SiteSettingsView(APIView):
    """Get and update site settings"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Get site settings"""
        # Try to get from Django settings first (from database cache)
        cached_settings = getattr(settings, 'SITE_SETTINGS', None)
        
        if cached_settings:
            return Response(cached_settings)
        
        # Return defaults
        return Response(DEFAULT_SETTINGS)

    def put(self, request):
        """Update site settings"""
        new_settings = request.data
        
        # Validate required fields
        required_fields = ['site_name', 'contact_email']
        for field in required_fields:
            if field not in new_settings:
                return Response(
                    {'error': f'{field} is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Update settings (in production, you'd save to database)
        # For now, we'll just return the settings and let the frontend handle caching
        all_settings = {**DEFAULT_SETTINGS, **new_settings}
        
        # Store in Django settings (in production, use database)
        settings.SITE_SETTINGS = all_settings
        
        return Response(all_settings)


class PublicSettingsView(APIView):
    """Public endpoint to get site settings (for frontend)"""
    permission_classes = [AllowAny]

    def get(self, request):
        """Get public site settings"""
        cached_settings = getattr(settings, 'SITE_SETTINGS', None)
        
        if cached_settings:
            # Return only public settings
            public_settings = {
                'site_name': cached_settings.get('site_name', 'Malaika Nest'),
                'site_description': cached_settings.get('site_description', ''),
                'contact_email': cached_settings.get('contact_email', ''),
                'contact_phone': cached_settings.get('contact_phone', ''),
                'address': cached_settings.get('address', ''),
                'facebook_url': cached_settings.get('facebook_url', ''),
                'instagram_url': cached_settings.get('instagram_url', ''),
                'twitter_url': cached_settings.get('twitter_url', ''),
                'shipping_fee': cached_settings.get('shipping_fee', '500'),
                'free_shipping_threshold': cached_settings.get('free_shipping_threshold', '5000'),
                'minimum_order_amount': cached_settings.get('minimum_order_amount', '1000'),
            }
            return Response(public_settings)
        
        # Return public defaults
        return Response({
            'site_name': 'Malaika Nest',
            'site_description': 'Premium Baby Products in Kenya',
            'contact_email': 'malaikanest7@gmail.com',
            'contact_phone': '+254700000000',
            'address': 'Nairobi, Kenya',
            'facebook_url': '',
            'instagram_url': '',
            'twitter_url': '',
            'shipping_fee': '500',
            'free_shipping_threshold': '5000',
            'minimum_order_amount': '1000',
        })

