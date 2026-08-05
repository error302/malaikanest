import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Creates a superuser (credentials from env, never hardcode secrets)"

    def handle(self, *args, **options):
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.WARNING("Superuser already exists"))
            return

        email = (
            os.environ.get("DJANGO_SUPERUSER_EMAIL")
            or os.environ.get("ADMIN_EMAIL")
            or "hello@malaikanest.com"
        )
        phone = os.environ.get("ADMIN_PHONE") or "+254712345678"
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD") or os.environ.get("ADMIN_PASSWORD")

        if not password:
            self.stdout.write(
                self.style.ERROR(
                    "ADMIN_PASSWORD / DJANGO_SUPERUSER_PASSWORD is not set. "
                    "Refusing to create a superuser with a weak/default password."
                )
            )
            raise SystemExit(1)

        User.objects.create_superuser(email=email, phone_number=phone, password=password)
        self.stdout.write(self.style.SUCCESS(f"Superuser created successfully: {email}"))
