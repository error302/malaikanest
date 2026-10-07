import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from apps.accounts.models import User
from apps.products.admin_serializers import AdminUserSerializer
from apps.products.admin_views import AdminUserViewSet
from apps.orders.models import Order
from django.db.models import Count
from django.db import connection, reset_queries
import time

def test_admin_user_serializer():
    print("Testing N+1 query in AdminUserSerializer")

    # Create some users and orders for test if they don't exist
    users = []
    for i in range(5):
        email = f"test_user_{i}_{int(time.time())}@example.com"
        user = User.objects.create_user(email=email, password="password", phone_number=f"+254700000{i:03d}")
        users.append(user)
        for j in range(3):
            Order.objects.create(user=user, total=100.0, delivery_fee=0.0)

    # Second test: With annotation using custom count field to avoid conflicts
    users_qs = User.objects.filter(id__in=[u.id for u in users]).annotate(annotated_order_count=Count('order', distinct=True))
    list(users_qs) # force evaluation
    reset_queries()

    class TestAdminUserSerializer(AdminUserSerializer):
        def get_total_orders(self, obj):
            if hasattr(obj, 'annotated_order_count'):
                return obj.annotated_order_count
            return Order.objects.filter(user=obj).count()

    serializer = TestAdminUserSerializer(users_qs, many=True)
    data = serializer.data
    query_count = len(connection.queries)
    print(f"Queries with annotation: {query_count}")

    # Clean up
    Order.objects.filter(user__in=users).delete()
    for u in users:
        u.delete()

test_admin_user_serializer()
