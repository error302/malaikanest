"""Local e2e seed: staff admin + customer + product + orders. Safe to re-run."""
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from decimal import Decimal  # noqa: E402

from apps.accounts.models import User  # noqa: E402
from apps.orders.models import Order, OrderItem  # noqa: E402
from apps.products.models import Category, Product  # noqa: E402


def run():
    # ── Users ──────────────────────────────────────────────────────────────
    admin = User.objects.filter(email="admin@malaikanest.com").first()
    if not admin:
        admin = User.objects.create_user(
            email="admin@malaikanest.com",
            phone_number="+254700000001",
            password="AdminPass123!",
            first_name="Store",
            last_name="Admin",
        )
    admin.is_staff = True
    admin.role = User.ROLE_ADMIN
    admin.is_email_verified = True
    admin.save()

    cust = User.objects.filter(email="customer@malaikanest.com").first()
    if not cust:
        cust = User.objects.create_user(
            email="customer@malaikanest.com",
            phone_number="+254700000002",
            password="CustPass123!",
            first_name="Jane",
            last_name="Customer",
        )
    cust.role = User.ROLE_CUSTOMER
    cust.is_email_verified = True
    cust.save()

    # ── Catalog ────────────────────────────────────────────────────────────
    cat, _ = Category.objects.get_or_create(name="E2E Essentials")
    prod, _ = Product.objects.get_or_create(
        name="E2E Test Onesie",
        defaults={"price": Decimal("1299.00"), "stock": 6, "category": cat},
    )

    # ── Orders ─────────────────────────────────────────────────────────────
    # Reset statuses on every run so the transition tests are repeatable
    # (the state machine correctly rejects e.g. paid -> paid).
    o1, _ = Order.objects.get_or_create(
        receipt_number="MN-E2E-001",
        defaults={
            "user": cust,
            "status": Order.STATUS_PAID,
            "subtotal": Decimal("1299.00"),
            "delivery_fee": Decimal("200.00"),
            "total": Decimal("1499.00"),
        },
    )
    o1.user = cust
    o1.status = Order.STATUS_PAID
    o1.save()
    if not OrderItem.objects.filter(order=o1).exists():
        OrderItem.objects.create(
            order=o1, product=prod, quantity=1, price=Decimal("1299.00")
        )

    o2, _ = Order.objects.get_or_create(
        receipt_number="MN-E2E-002",
        defaults={
            "guest_email": "guest@example.com",
            "status": Order.STATUS_PENDING,
            "subtotal": Decimal("1299.00"),
            "delivery_fee": Decimal("200.00"),
            "total": Decimal("1499.00"),
        },
    )
    o2.user = None
    o2.guest_email = "guest@example.com"
    o2.status = Order.STATUS_PENDING
    o2.save()
    if not OrderItem.objects.filter(order=o2).exists():
        OrderItem.objects.create(
            order=o2, product=prod, quantity=1, price=Decimal("1299.00")
        )

    print("SEEDED OK:",
          f"users={User.objects.count()}",
          f"products={Product.objects.count()}",
          f"orders={Order.objects.count()}")


if __name__ == "__main__":
    run()
