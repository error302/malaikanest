"""
Management command to fix or create admin user.

Never hardcode a password. Provide --password or set the ADMIN_PASSWORD env var;
the command refuses to run without one.
"""
import os

from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Fix or create admin user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email of the admin user to fix',
            default='hello@malaikanest.com',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for the admin user (or set ADMIN_PASSWORD env var)',
            default=None,
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password'] or os.environ.get('ADMIN_PASSWORD')

        if not password:
            self.stdout.write(
                self.style.ERROR(
                    "Must provide --password or set the ADMIN_PASSWORD env var. "
                    "Refusing to hardcode/guess a password."
                )
            )
            raise SystemExit(1)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'phone_number': '+254700000000',  # Placeholder phone
                'is_staff': True,
                'is_superuser': True,
                'role': User.ROLE_ADMIN,
                'is_active': True,
                'is_email_verified': True,
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
            user.role = User.ROLE_ADMIN
            user.is_active = True
            user.is_email_verified = True
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Fixed admin user: {email}'))

        # Verify
        user = User.objects.get(email=email)
        self.stdout.write(f'  is_staff: {user.is_staff}')
        self.stdout.write(f'  is_superuser: {user.is_superuser}')
        self.stdout.write(f'  role: {user.role}')
        self.stdout.write(f'  is_active: {user.is_active}')
        self.stdout.write(f'  is_email_verified: {user.is_email_verified}')

