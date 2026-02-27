from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Creates a superuser"

    def handle(self, *args, **options):
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.WARNING("Superuser already exists"))
        else:
            User.objects.create_superuser("malaikanest7@gmail.com", "Dosho10701$")
            self.stdout.write(self.style.SUCCESS("Superuser created successfully"))
