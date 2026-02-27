import traceback
import sys
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kenya_ecom.settings')
import django
django.setup()

from django.core.management import call_command

try:
    call_command('seed_categories')
except Exception as e:
    with open('error.log', 'w') as f:
        traceback.print_exc(file=f)
