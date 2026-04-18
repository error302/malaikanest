import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

import django

django.setup()

from apps.accounts.models import User

EMAIL = "codex.verify.20260327.1033@example.com"

user = User.objects.get(email=EMAIL)
print(user.verification_token or "")
