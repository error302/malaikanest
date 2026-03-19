from django.urls import path
from .views import (
    RegisterView,
    ProfileView,
    logout_view,
    password_reset_request_view,
    password_reset_confirm_view,
    verify_email_view,
    resend_verification_view,
    CookieTokenObtainPairView,
    AdminCookieTokenObtainPairView,
    CookieTokenRefreshView,
    admin_session_view,
    google_auth_view,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/", verify_email_view, name="verify_email"),
    path("resend-verification/", resend_verification_view, name="resend_verification"),
    path("token/", CookieTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("admin/login/", AdminCookieTokenObtainPairView.as_view(), name="admin_login"),
    path("admin/session/", admin_session_view, name="admin_session"),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("logout/", logout_view, name="logout"),
    path("password/reset/", password_reset_request_view, name="password_reset_request"),
    path(
        "password/reset/confirm/",
        password_reset_confirm_view,
        name="password_reset_confirm",
    ),
    path("google/", google_auth_view, name="google_auth"),
]
