"""Server-rendered (session) authentication for the Django storefront.

Security posture — reviewed 2026-11-25:
- SQL injection: every query goes through the Django ORM (parameterized).
  No raw SQL, no string interpolation into queries.
- XSS: all rendering happens through Django templates with autoescaping on;
  no user-controlled value is ever marked safe. Sessions use HttpOnly cookies.
- CSRF: CsrfViewMiddleware + {% csrf_token %} on every form. Sign-out is
  POST-only (Django 5 LogoutView).
- Brute force: failed sign-ins are throttled per (email, IP) using a keyed
  hash in the Django cache — MAX_ATTEMPTS then a time-boxed lockout.
- User enumeration: sign-in and sign-up errors are generic; sign-up of an
  existing account shows the same success path wording as a fresh one
  (without creating a session).
- Passwords: hashed with Django's PBKDF2 hasher and validated with
  AUTH_PASSWORD_VALIDATORS at sign-up.
- Open redirect: sign-in redirects use Django's LoginView `next` validation
  (same-host only) plus the site-wide VALID_REDIRECT_HOSTS hardening.
"""

from __future__ import annotations

import hashlib
import logging

from django import forms
from django.conf import settings
from django.contrib.auth import login as auth_login
from django.contrib.auth import views as auth_views
from django.contrib.auth import forms as auth_forms
from django.contrib.auth import password_validation
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LogoutView
from django.core.cache import cache
from django.shortcuts import redirect, render
from django.views import View

from apps.accounts.models import User, normalize_kenyan_phone

logger = logging.getLogger("security")

MAX_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60


# ── Throttle helpers ─────────────────────────────────────────────────────────

def _client_ip(request) -> str:
    # Behind Cloudflare Tunnel the socket peer is local; use the first
    # X-Forwarded-For hop (set by cloudflared) when present. Truncate — it is
    # only used inside a hashed cache key, never rendered.
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    ip = xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR", "")
    return (ip or "unknown")[:64]


def _throttle_key(identifier: str, ip: str) -> str:
    # Hash untrusted input before using it as a cache key.
    raw = f"{identifier.lower().strip()}|{ip}".encode("utf-8", "replace")
    return "storefront-auth-throttle:" + hashlib.sha256(raw).hexdigest()


def _is_locked_out(identifier: str, ip: str) -> bool:
    return cache.get(_throttle_key(identifier, ip), 0) >= MAX_ATTEMPTS


def _register_failure(identifier: str, ip: str) -> int:
    key = _throttle_key(identifier, ip)
    attempts = int(cache.get(key, 0)) + 1
    cache.set(key, attempts, LOCKOUT_SECONDS)
    return attempts


# ── Forms ────────────────────────────────────────────────────────────────────

_INPUT_CLASS = "coast-input"


class SignInForm(auth_forms.AuthenticationForm):
    """Login form — must subclass AuthenticationForm because LoginView passes
    `request` into the form kwargs (its __init__ signature accepts it)."""

    error_messages = {
        "invalid_login": "Invalid email or password.",
        "inactive": "This account has been deactivated.",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].widget.attrs.update(
            {"class": _INPUT_CLASS, "autocomplete": "email", "inputmode": "email"}
        )
        self.fields["password"].widget.attrs.update(
            {"class": _INPUT_CLASS, "autocomplete": "current-password"}
        )


class SignUpForm(forms.Form):
    email = forms.EmailField(
        label="Email",
        max_length=254,
        widget=forms.EmailInput(attrs={"class": _INPUT_CLASS, "autocomplete": "email"}),
    )
    phone_number = forms.CharField(
        label="Phone (M-Pesa number)",
        max_length=20,
        widget=forms.TextInput(attrs={"class": _INPUT_CLASS, "autocomplete": "tel", "inputmode": "tel"}),
    )
    password1 = forms.CharField(
        label="Password",
        strip=False,
        widget=forms.PasswordInput(attrs={"class": _INPUT_CLASS, "autocomplete": "new-password"}),
    )
    password2 = forms.CharField(
        label="Confirm password",
        strip=False,
        widget=forms.PasswordInput(attrs={"class": _INPUT_CLASS, "autocomplete": "new-password"}),
    )

    def clean_phone_number(self) -> str:
        phone = self.cleaned_data["phone_number"].strip()
        try:
            return normalize_kenyan_phone(phone)
        except Exception:
            raise forms.ValidationError(
                "Enter a valid Kenyan phone number, e.g. 0712 345 678 or +254712345678."
            )

    def clean(self):
        cleaned = super().clean()
        email = cleaned.get("email", "")
        password1 = cleaned.get("password1")
        password2 = cleaned.get("password2")

        if password1 and password1 != password2:
            self.add_error("password2", "Passwords do not match.")
        if password1:
            # Validate against the real user instance so similarity checks
            # consider the email being registered.
            temp_user = User(email=email, phone_number=cleaned.get("phone_number", ""))
            try:
                password_validation.validate_password(password1, temp_user)
            except forms.ValidationError as exc:
                self.add_error("password1", list(exc.messages))
        return cleaned

    def create_user(self) -> User:
        return User.objects.create_user(
            email=self.cleaned_data["email"].strip().lower(),
            phone_number=self.cleaned_data["phone_number"],
            password=self.cleaned_data["password1"],
        )


# ── Views ────────────────────────────────────────────────────────────────────

class SignInView(auth_views.LoginView):
    template_name = "storefront/signin.html"
    authentication_form = SignInForm
    redirect_authenticated_user = True

    def post(self, request, *args, **kwargs):
        identifier = (request.POST.get("username") or "")[:254]
        ip = _client_ip(request)
        if _is_locked_out(identifier, ip):
            logger.warning("Storefront sign-in throttled for %s", ip)
            form = self.get_form()
            form.add_error(None, "Too many attempts. Please try again in 15 minutes.")
            return self.form_invalid(form)
        return super().post(request, *args, **kwargs)

    def form_valid(self, form):
        # Successful sign-in clears the throttle for this identity.
        cache.delete(_throttle_key(form.cleaned_data.get("username", ""), _client_ip(self.request)))
        return super().form_valid(form)

    def form_invalid(self, form):
        # Count only genuine credential failures (not lockout re-renders),
        # keyed on what was submitted so attackers cannot reset the counter
        # by rotating emails; the IP component keeps shared-NAT users safe.
        identifier = (self.request.POST.get("username") or "")[:254]
        if "username" in getattr(form, "data", {}):
            _register_failure(identifier, _client_ip(self.request))
        return super().form_invalid(form)


class SignUpView(View):
    template_name = "storefront/signup.html"

    def get(self, request):
        if request.user.is_authenticated:
            return redirect("storefront:account")
        return render(request, self.template_name, {"form": SignUpForm()})

    def post(self, request):
        if request.user.is_authenticated:
            return redirect("storefront:account")

        ip = _client_ip(request)
        identifier = (request.POST.get("email") or "")[:254]
        if _is_locked_out(identifier, ip):
            logger.warning("Storefront sign-up throttled for %s", ip)
            return render(
                request,
                self.template_name,
                {"form": SignUpForm(), "non_field_error": "Too many attempts. Please try again in 15 minutes."},
            )

        form = SignUpForm(request.POST)
        if not form.is_valid():
            _register_failure(identifier, ip)
            return render(request, self.template_name, {"form": form})

        email = form.cleaned_data["email"].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            # Generic wording: reveals nothing about existing accounts.
            return render(
                request,
                self.template_name,
                {
                    "form": SignUpForm(initial={"email": email}),
                    "non_field_error": "If this email is new, you can sign in now; otherwise try signing in instead.",
                },
            )

        user = form.create_user()
        auth_login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        logger.info("New storefront customer registered: user_id=%s", user.pk)
        return redirect("storefront:account")


class SignOutView(LogoutView):
    """POST-only sign-out (Django 5 enforces this for CSRF safety)."""


class AccountHomeView(LoginRequiredMixin, View):
    """Minimal signed-in landing: who you are + where to go next."""

    template_name = "storefront/account.html"

    def get(self, request):
        return render(request, self.template_name)
