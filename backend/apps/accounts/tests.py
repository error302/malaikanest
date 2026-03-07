from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class AuthCookieLoginTests(APITestCase):
    def test_customer_login_sets_http_only_cookies_and_profile_works(self):
        password = "StrongPass123!"
        User.objects.create_user(
            email="customer@example.com",
            phone="254700111222",
            password=password,
            role="customer",
        )

        response = self.client.post(
            "/api/accounts/token/",
            {"email": "customer@example.com", "password": password},
            format="json",
            secure=True,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)
        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)
        self.assertTrue(response.cookies["access_token"]["httponly"])
        self.assertTrue(response.cookies["refresh_token"]["httponly"])

        profile = self.client.get("/api/accounts/profile/", secure=True)
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data["email"], "customer@example.com")
        self.assertEqual(profile.data["role"], "customer")

    def test_admin_login_sets_cookies_and_can_access_admin_reconcile_endpoint(self):
        password = "AdminStrongPass123!"
        admin = User.objects.create_superuser(
            email="admin@example.com",
            phone="254700333444",
            password=password,
        )

        login = self.client.post(
            "/api/accounts/token/",
            {"email": admin.email, "password": password},
            format="json",
            secure=True,
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", login.cookies)
        self.assertIn("refresh_token", login.cookies)

        profile = self.client.get("/api/accounts/profile/", secure=True)
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data["role"], "admin")

        reconcile = self.client.get("/api/payments/admin/reconcile/candidates/", secure=True)
        self.assertEqual(reconcile.status_code, status.HTTP_200_OK)