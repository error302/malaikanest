import json
from django.test import TestCase
from unittest.mock import patch, MagicMock
from apps.products.admin_serializers import AdminCategorySerializer, AdminProductSerializer
from apps.products.models import Category
from django.core.files.uploadedfile import SimpleUploadedFile

class TestAdminSerializersSSRF(TestCase):
    @patch('requests.get')
    def test_category_serializer_ssrf_protection(self, mock_get):
        serializer = AdminCategorySerializer()

        # Test valid cloudinary url
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.content = b"fake image"
        mock_get.return_value = mock_resp

        result = serializer._download_image('https://res.cloudinary.com/test/image/upload/v1234/test.jpg')
        self.assertIsNotNone(result)
        mock_get.assert_called_once_with('https://res.cloudinary.com/test/image/upload/v1234/test.jpg', timeout=10, allow_redirects=False)

        # Test internal network (should be blocked before requests.get)
        mock_get.reset_mock()
        result = serializer._download_image('http://169.254.169.254/latest/meta-data/')
        self.assertIsNone(result)
        mock_get.assert_not_called()

        # Test non-https
        mock_get.reset_mock()
        result = serializer._download_image('http://res.cloudinary.com/test.jpg')
        self.assertIsNone(result)
        mock_get.assert_not_called()

    @patch('requests.get')
    def test_product_serializer_ssrf_protection(self, mock_get):
        serializer = AdminProductSerializer()

        # Test internal network (should be blocked before requests.get)
        mock_get.reset_mock()
        result = serializer._download_image('http://localhost:8000/admin', 'test.jpg')
        self.assertIsNone(result)
        mock_get.assert_not_called()
