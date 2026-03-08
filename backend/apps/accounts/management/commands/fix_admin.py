"""
Management command to fix or create admin user
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Fix or create admin user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email of the admin user to fix',
            default='malaikanest7@gmail.com',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for the admin user',
            default='Dosho10701$',
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'phone': '+254700000000',  # Placeholder phone
                'is_staff': True,
                'is_superuser': True,
                'role': 'admin',
                'is_active': True,
                'email_verified': True,
            }
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {email}'))
        else:
            # Fix existing user
            user.is_staff = True
            user.is_superuser = True
            user.role = 'admin'
            user.is_active = True
            user.email_verified = True
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Fixed admin user: {email}'))

        # Verify
        user = User.objects.get(email=email)
        self.stdout.write(f'  is_staff: {user.is_staff}')
        self.stdout.write(f'  is_superuser: {user.is_superuser}')
        self.stdout.write(f'  role: {user.role}')
        self.stdout.write(f'  is_active: {user.is_active}')
        self.stdout.write(f'  email_verified: {user.email_verified}')

