import os
import sys

# Set up Django environment manually
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.prod') # try prod or base

# Force env to base if running locally without full prod env vars
os.environ['DJANGO_ENV'] = 'prod' 

import django
django.setup()

from django.db import connection

print("Dropping public schema...")
with connection.cursor() as cursor:
    cursor.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
    # Grant permissions back if necessary
    cursor.execute("GRANT ALL ON SCHEMA public TO public;")
print("Schema dropped and recreated successfully.")
