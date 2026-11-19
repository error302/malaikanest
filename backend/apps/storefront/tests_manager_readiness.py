import os
from unittest.mock import patch
from django.test import TestCase, Client, override_settings
from apps.accounts.models import User
from apps.payments.services import PaymentService

class ManagerReadinessTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_superuser(email="manager@example.test", phone_number="+254700001234", password="TestOnlyPassword123!")
        self.client = Client(enforce_csrf_checks=True)
        self.client.force_login(self.staff)

    def test_classic_staff_session_can_open_manager_apis(self):
        for url in ["/api/accounts/admin/session/", "/api/products/admin/products/", "/api/products/admin/categories/", "/api/products/admin/banners/", "/api/products/admin/orders/", "/api/orders/admin/analytics/", "/api/core/settings/"]:
            self.assertEqual(self.client.get(url).status_code, 200, url)

    def test_session_mutations_require_csrf_and_logout_clears_session(self):
        self.assertEqual(self.client.post("/api/accounts/logout/").status_code, 403)
        shell = self.client.get("/manage/dashboard/")
        token = shell.cookies["csrftoken"].value
        response = self.client.post("/api/accounts/logout/", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("_auth_user_id", self.client.session)
        self.assertEqual(self.client.get("/manage/dashboard/").status_code, 302)

    def test_nonstaff_session_cannot_use_manager_apis(self):
        self.staff.is_staff = False
        self.staff.is_superuser = False
        self.staff.role = User.ROLE_CUSTOMER
        self.staff.save()
        self.assertEqual(self.client.get("/api/products/admin/products/").status_code, 403)

    def test_pwa_manifest_and_worker_are_public_and_do_not_cache_transactions(self):
        self.client.logout()
        response = self.client.get("/manifest.webmanifest")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["display"], "standalone")
        worker = self.client.get("/sw.js")
        self.assertEqual(worker.status_code, 200)
        self.assertEqual(worker["Cache-Control"], "no-cache")
        self.assertIn(b'event.request.method !== "GET"', worker.content)

    @override_settings(DEBUG=False)
    def test_mpesa_defaults_to_real_mode_when_debug_is_off(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(PaymentService.should_use_mock_mpesa())
