from .base import *
import os
from pathlib import Path

DEBUG = True

ALLOWED_HOSTS = ['*']

# Check if PostgreSQL credentials are provided - use PostgreSQL if so
DB_NAME = os.getenv('DB_NAME')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')

if DB_NAME and DB_USER:
    # Use PostgreSQL if database name and user are provided
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': DB_NAME,
            'USER': DB_USER,
            'PASSWORD': DB_PASSWORD,
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }
    print("Using PostgreSQL database")
else:
    # Default to SQLite for development without database config
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
    print("Using SQLite database (no PostgreSQL config found)")

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# In dev, allow all local origins for convenience - DO NOT set CORS_ALLOW_ALL_ORIGINS
# The base.py CORS_ALLOWED_ORIGINS already handles allowed origins from env
if not os.getenv("CORS_ALLOWED_ORIGINS"):
    # Add common dev origins if none are configured
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

print("Running in DEVELOPMENT mode")
