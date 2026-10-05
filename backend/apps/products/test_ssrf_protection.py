from django.test import TestCase
from unittest.mock import patch, MagicMock
from apps.products.admin_serializers import AdminCategorySerializer, AdminProductSerializer
import requests

class SSRFProtectionTests(TestCase):
    def setUp(self):
        self.category_serializer = AdminCategorySerializer()
        self.product_serializer = AdminProductSerializer()

    @patch('requests.get')
    def test_category_serializer_rejects_non_https(self, mock_get):
        result = self.category_serializer._download_image("http://res.cloudinary.com/foo/bar.jpg")
        self.assertIsNone(result)
        mock_get.assert_not_called()

    @patch('requests.get')
    def test_category_serializer_rejects_unallowed_hosts(self, mock_get):
        result = self.category_serializer._download_image("https://evil.com/foo/bar.jpg")
        self.assertIsNone(result)
        mock_get.assert_not_called()

    @patch('requests.get')
    def test_category_serializer_accepts_allowed_hosts(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"image content"
        mock_get.return_value = mock_response

        result = self.category_serializer._download_image("https://res.cloudinary.com/foo/bar.jpg")
        self.assertIsNotNone(result)
        mock_get.assert_called_once_with("https://res.cloudinary.com/foo/bar.jpg", timeout=10, allow_redirects=False)

    @patch('requests.get')
    def test_product_serializer_rejects_non_https(self, mock_get):
        result = self.product_serializer._download_image("http://res.cloudinary.com/foo/bar.jpg", "test.jpg")
        self.assertIsNone(result)
        mock_get.assert_not_called()

    @patch('requests.get')
    def test_product_serializer_rejects_unallowed_hosts(self, mock_get):
        result = self.product_serializer._download_image("https://evil.com/foo/bar.jpg", "test.jpg")
        self.assertIsNone(result)
        mock_get.assert_not_called()

    @patch('requests.get')
    def test_product_serializer_accepts_allowed_hosts(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"image content"
        mock_get.return_value = mock_response

        result = self.product_serializer._download_image("https://res.cloudinary.com/foo/bar.jpg", "test.jpg")
        self.assertIsNotNone(result)
        mock_get.assert_called_once_with("https://res.cloudinary.com/foo/bar.jpg", timeout=10, allow_redirects=False)
