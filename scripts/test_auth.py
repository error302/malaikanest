import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate

users = [
    'mohameddosho20@gmail.com',
    'malaikanest7@gmail.com',
    'hello@malaikanest.com'
]

pwd = "MalaikaNest2026!#"

for email in users:
    u = authenticate(email=email, password=pwd)
    print(f"Auth check for {email}: {'SUCCESS (Admin Verified)' if u and u.is_staff and u.is_superuser else 'FAILED'}")
