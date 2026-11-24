import hashlib

from django.conf import settings
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.views import PasswordResetConfirmView, PasswordResetView
from django.core.cache import cache
from django.db import transaction
from django.http import HttpResponse
from django.urls import reverse_lazy

from apps.core.utils import get_client_ip
from .authentication import invalidate_all_user_tokens


class StorePasswordResetForm(PasswordResetForm):
    def get_users(self, email):
        return (user for user in super().get_users(email) if user.is_staff)

    def save(self, **kwargs):
        if not settings.DEBUG:
            kwargs.update(domain_override="malaikanest.com", use_https=True)
        return super().save(**kwargs)


class StorePasswordResetView(PasswordResetView):
    form_class = StorePasswordResetForm
    success_url = reverse_lazy("password_reset_done")

    def post(self, request, *args, **kwargs):
        key = "store-password-reset:" + hashlib.sha256(get_client_ip(request).encode()).hexdigest()
        cache.add(key, 0, 3600)
        if cache.incr(key) > 5:
            return HttpResponse("Too many requests. Try again in an hour.", status=429)
        return super().post(request, *args, **kwargs)


class StorePasswordResetConfirmView(PasswordResetConfirmView):
    success_url = reverse_lazy("password_reset_complete")

    def get_user(self, uidb64):
        user = super().get_user(uidb64)
        return user if user and user.is_staff and user.is_active else None

    @transaction.atomic
    def form_valid(self, form):
        response = super().form_valid(form)
        invalidate_all_user_tokens(form.user)
        return response
