#!/usr/bin/env python
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
print(f"Using Django settings: {os.environ['DJANGO_SETTINGS_MODULE']}")

from django.contrib.auth import get_user_model
User = get_user_model()

# Create a test user
test_email = "test@example.com"
test_password = "testpass123"
test_phone = "+254700000000"

# Check if user exists
if not User.objects.filter(email=test_email).exists():
    # Keep this utility idempotent even when phone numbers collide with existing fixtures.
    candidate_phone = test_phone
    if User.objects.filter(phone=candidate_phone).exclude(email=test_email).exists():
        candidate_phone = "+2547" + str(abs(hash(test_email)) % 100000000).zfill(8)

    user = User.objects.create_user(
        email=test_email,
        phone=candidate_phone,
        password=test_password,
        first_name="Test",
        last_name="User",
        email_verified=True,  # Mark as verified so they can login
        is_active=True
    )
    print(f"Created test user: {test_email}")
    print(f"Password: {test_password}")
else:
    # Update existing user
    user = User.objects.get(email=test_email)
    user.set_password(test_password)
    user.email_verified = True
    user.is_active = True
    if User.objects.filter(phone=test_phone).exclude(email=test_email).exists() and user.phone == test_phone:
        user.phone = "+2547" + str(abs(hash(test_email)) % 100000000).zfill(8)
    user.save()
    print(f"Updated test user: {test_email}")
    print(f"Password: {test_password}")

# Verify the user
print(f"Email verified: {user.email_verified}")
print(f"Is active: {user.is_active}")
print(f"Password hash starts with: {user.password[:50]}")
print(f"User ID: {user.id}")
