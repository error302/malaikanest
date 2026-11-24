from django.apps import AppConfig
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver


class StorefrontConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.storefront"
    verbose_name = "Storefront"

    def ready(self):
        # Fold a guest's saved items into their account the moment they sign in.
        from .views_wishlist import merge_session_wishlist

        @receiver(user_logged_in, dispatch_uid="storefront_merge_wishlist")
        def _merge_wishlist(sender, request, user, **kwargs):
            if request is not None:
                merge_session_wishlist(request, user=user)
