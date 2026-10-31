from django.test import TestCase
from django.db import connection
from django.test.utils import CaptureQueriesContext
from apps.products.models import Product, ProductVariant, Category, VariantInventory, Inventory

class PerformanceTests(TestCase):
    def test_nplus1_inventory_summary(self):
        c = Category.objects.create(name="Test Category 2", slug="test-category-2")
        for i in range(5):
            p = Product.objects.create(name=f"Test Product {i}", slug=f"test-product-{i}", is_active=True, price=10, category=c)
            v = ProductVariant.objects.create(product=p, is_active=True, price_modifier=0)
            VariantInventory.objects.create(variant=v, quantity=10, reserved=2)

        with CaptureQueriesContext(connection) as queries:
            qs = list(Product.objects.filter(is_active=True).prefetch_related("variants__inventory"))
            for obj in qs:
                # accessing available_stock
                stock = obj.available_stock

        self.assertEqual(len(queries.captured_queries), 3)

    def test_nplus1_inventory_summary_no_variants(self):
        c = Category.objects.create(name="Test Category 3", slug="test-category-3")
        for i in range(5):
            p = Product.objects.create(name=f"Test Product {i}", slug=f"test-product-{i}", is_active=True, price=10, category=c)
            Inventory.objects.create(product=p, quantity=10, reserved=2)

        with CaptureQueriesContext(connection) as queries:
            qs = list(Product.objects.filter(is_active=True).prefetch_related("variants__inventory", "inventory"))
            for obj in qs:
                # accessing available_stock
                stock = obj.available_stock

        self.assertEqual(len(queries.captured_queries), 3)

    def test_nplus1_inventory_summary_partial_prefetch(self):
        c = Category.objects.create(name="Test Category 4", slug="test-category-4")
        for i in range(5):
            p = Product.objects.create(name=f"Test Product {i}", slug=f"test-product-{i}", is_active=True, price=10, category=c)
            v = ProductVariant.objects.create(product=p, is_active=True, price_modifier=0)
            VariantInventory.objects.create(variant=v, quantity=10, reserved=2)

        with CaptureQueriesContext(connection) as queries:
            qs = list(Product.objects.filter(is_active=True).prefetch_related("variants"))
            for obj in qs:
                # accessing available_stock
                stock = obj.available_stock

        # Product, variants, and then 5 queries for variant inventory
        self.assertEqual(len(queries.captured_queries), 7)
