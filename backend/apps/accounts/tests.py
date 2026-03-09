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

    def test_admin_login_endpoint_allows_admin_and_sets_http_only_cookies(self):
        password = "AdminOnlyPass123!"
        admin = User.objects.create_superuser(
            email="owner@example.com",
            phone="254700555666",
            password=password,
        )

        response = self.client.post(
            "/api/accounts/admin/login/",
            {"email": admin.email, "password": password},
            format="json",
            secure=True,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)
        self.assertTrue(response.cookies["access_token"]["httponly"])
        self.assertTrue(response.cookies["refresh_token"]["httponly"])

        session = self.client.get("/api/accounts/admin/session/", secure=True)
        self.assertEqual(session.status_code, status.HTTP_200_OK)
        self.assertEqual(session.data["email"], admin.email)
        self.assertTrue(session.data["is_staff"])

    def test_admin_login_endpoint_rejects_non_admin_users(self):
        password = "CustomerPass123!"
        customer = User.objects.create_user(
            email="shopper@example.com",
            phone="254700777888",
            password=password,
            role="customer",
        )

        response = self.client.post(
            "/api/accounts/admin/login/",
            {"email": customer.email, "password": password},
            format="json",
            secure=True,
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], "Admin access required")
