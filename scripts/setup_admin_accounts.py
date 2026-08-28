import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User

admin_accounts = [
    {
        'email': 'mohameddosho20@gmail.com',
        'first_name': 'Mohamed',
        'last_name': 'Dosho',
    },
    {
        'email': 'malaikanest7@gmail.com',
        'first_name': 'Malaika',
        'last_name': 'Nest',
    },
    {
        'email': 'hello@malaikanest.com',
        'first_name': 'Malaika',
        'last_name': 'Admin',
    }
]

DEFAULT_ADMIN_PASS = "MalaikaNest2026!#"

print("=== CONFIGURING ADMIN USERS ===")
for acc in admin_accounts:
    email = acc['email']
    user = User.objects.filter(email=email).first()
    if not user:
        user = User(
            email=email,
            first_name=acc['first_name'],
            last_name=acc['last_name'],
            is_staff=True,
            is_superuser=True,
            role=User.ROLE_ADMIN,
            is_active=True,
            is_email_verified=True,
            phone_number='+254726771321'
        )
        user.set_password(DEFAULT_ADMIN_PASS)
        user.save()
        print(f"[CREATED] Email: {user.email} | Role: {user.role} | Superuser: {user.is_superuser} | Staff: {user.is_staff}")
    else:
        user.is_staff = True
        user.is_superuser = True
        user.role = User.ROLE_ADMIN
        user.is_active = True
        user.is_email_verified = True
        user.set_password(DEFAULT_ADMIN_PASS)
        user.save()
        print(f"[PROMOTED & UPDATED] Email: {user.email} | Role: {user.role} | Superuser: {user.is_superuser} | Staff: {user.is_staff}")

print("\nAll admin accounts configured successfully with full access permissions!")
