from django.core.management.base import BaseCommand
from apps.payments.tasks import reconcile_payments_task


class Command(BaseCommand):
    help = 'Trigger payment reconciliation task'

    def handle(self, *args, **options):
        reconcile_payments_task.delay()
        self.stdout.write(self.style.SUCCESS('Reconciliation task queued'))
