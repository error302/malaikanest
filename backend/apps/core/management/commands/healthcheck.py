from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError
import os
import sys

class Command(BaseCommand):
    help = 'Performs a basic healthcheck: database and redis (if configured)'

    def handle(self, *args, **options):
        ok = True

        # Check database
        try:
            db_conn = connections['default']
            c = db_conn.cursor()
            c.execute('SELECT 1')
            c.fetchone()
            self.stdout.write(self.style.SUCCESS('Database: OK'))
        except OperationalError as e:
            self.stdout.write(self.style.ERROR(f'Database: ERROR - {e}'))
            ok = False

        # Check Redis if REDIS_URL is configured
        redis_url = os.getenv('REDIS_URL')
        if redis_url:
            try:
                import redis as redis_lib
                r = redis_lib.from_url(redis_url)
                r.ping()
                self.stdout.write(self.style.SUCCESS('Redis: OK'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Redis: ERROR - {e}'))
                ok = False
        else:
            self.stdout.write(self.style.WARNING('Redis: not configured (REDIS_URL missing)'))

        if not ok:
            sys.exit(1)
