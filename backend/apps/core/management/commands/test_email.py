from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings


class Command(BaseCommand):
    help = 'Send a test email to verify SMTP configuration'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address to send test to')

    def handle(self, *args, **options):
        email = options['email']
        
        self.stdout.write(self.style.WARNING(f'Sending test email to {email}...'))
        
        try:
            send_mail(
                subject='Test Email - Malaika Nest',
                message='This is a test email from Malaika Nest e-commerce platform.',
                html_message='<h1>Malaika Nest</h1><p>This is a test email to verify your email configuration is working correctly.</p>',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully sent test email to {email}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to send email: {str(e)}'))
            self.stdout.write(self.style.WARNING('Make sure you are using a Gmail App Password, not your regular password.'))
            self.stdout.write(self.style.WARNING('To create an App Password:'))
            self.stdout.write(self.style.WARNING('1. Go to https://myaccount.google.com/security'))
            self.stdout.write(self.style.WARNING('2. Enable 2-Factor Authentication'))
            self.stdout.write(self.style.WARNING('3. Go to App Passwords and generate one'))
            self.stdout.write(self.style.WARNING('4. Use that 16-character password in EMAIL_HOST_PASSWORD'))
