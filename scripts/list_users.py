import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User

print("=== REGISTERED USERS IN DATABASE ===")
for u in User.objects.all():
    print(f"Email: {u.email} | Role: {u.role} | Staff: {u.is_staff} | Superuser: {u.is_superuser} | Active: {u.is_active}")
