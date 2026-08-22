import os
import tempfile
from copy import deepcopy

from django.test import SimpleTestCase

from config.settings.guards import validate_production_env


class ProductionEnvGuardrailTests(SimpleTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        fd, cls.public_key_path = tempfile.mkstemp(suffix=".pem")
        with os.fdopen(fd, "wb") as f:
            f.write(b"-----BEGIN PUBLIC KEY-----\nTEST\n-----END PUBLIC KEY-----\n")

    @classmethod
    def tearDownClass(cls):
        try:
            os.remove(cls.public_key_path)
        except OSError:
            pass
        super().tearDownClass()

    def _base_production_env(self):
        return {
            "ENVIRONMENT": "production",
            "DEBUG": "False",
            "SECRET_KEY": "this-is-a-very-long-secure-production-secret-key-12345",
            "DATABASE_URL": "postgres://user:pass@db:5432/app",
            "ALLOWED_HOSTS": "shop.example.com",
            "FRONTEND_URL": "https://shop.example.com",
            "CORS_ALLOWED_ORIGINS": "https://shop.example.com",
            "CSRF_TRUSTED_ORIGINS": "https://shop.example.com",
            "MPESA_CALLBACK_URL": "https://api.myshop.co.ke/api/payments/mpesa/callback/",
            "MPESA_CONSUMER_KEY": "consumer-key-live-abc",
            "MPESA_CONSUMER_SECRET": "consumer-secret-live-abc",
            "MPESA_PASSKEY": "passkey-live-abc",
            "MPESA_SHORTCODE": "3104615",
            "MPESA_STRICT_SIGNATURE": "true",
            "MPESA_PUBLIC_KEY_PATH": self.public_key_path,
            "EMAIL_HOST_USER": "mailer@example.com",
            "EMAIL_HOST_PASSWORD": "gmail-app-password-live",
            "CLOUDINARY_CLOUD_NAME": "cloud-live",
            "CLOUDINARY_API_KEY": "cloud-api-key-live",
            "CLOUDINARY_API_SECRET": "cloud-api-secret-live",
        }

    def test_rejects_debug_true_in_production(self):
        env = self._base_production_env()
        env["DEBUG"] = "True"
        with self.assertRaises(RuntimeError):
            validate_production_env(env)

    def test_rejects_placeholder_secret(self):
        env = self._base_production_env()
        env["SECRET_KEY"] = "changeme"
        with self.assertRaises(RuntimeError):
            validate_production_env(env)

    def test_rejects_localhost_callback_url(self):
        env = self._base_production_env()
        env["MPESA_CALLBACK_URL"] = "http://localhost:8000/api/payments/mpesa/callback/"
        with self.assertRaises(RuntimeError):
            validate_production_env(env)

    def test_rejects_missing_required_secure_vars(self):
        env = self._base_production_env()
        env.pop("EMAIL_HOST_PASSWORD")
        with self.assertRaises(RuntimeError):
            validate_production_env(env)

    def test_rejects_mpesa_mock_mode_in_production(self):
        env = self._base_production_env()
        env["MPESA_MOCK_MODE"] = "true"
        with self.assertRaises(RuntimeError):
            validate_production_env(env)

    def test_rejects_placeholder_mpesa_credentials(self):
        env = self._base_production_env()
        env["MPESA_CONSUMER_KEY"] = "local-placeholder"
        with self.assertRaises(RuntimeError):
            validate_production_env(env)

    def test_rejects_missing_mpesa_passkey(self):
        env = self._base_production_env()
        env.pop("MPESA_PASSKEY")
        with self.assertRaises(RuntimeError):
            validate_production_env(env)

    def test_rejects_strict_signature_disabled_in_production(self):
        env = self._base_production_env()
        env.pop("MPESA_STRICT_SIGNATURE")
        with self.assertRaises(RuntimeError):
            validate_production_env(env)

    def test_rejects_unreadable_public_key_path_when_strict_signature_enabled(self):
        env = self._base_production_env()
        env["MPESA_PUBLIC_KEY_PATH"] = "/nonexistent/safaricom-public-key.pem"
        with self.assertRaises(RuntimeError):
            validate_production_env(env)

    def test_valid_production_env_passes(self):
        env = self._base_production_env()
        validate_production_env(env)
