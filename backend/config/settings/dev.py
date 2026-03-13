from .base import *
import os
from pathlib import Path

DEBUG = True

ALLOWED_HOSTS = ['*']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'malaika_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

print('Running in DEVELOPMENT mode with PostgreSQL')

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Always allow both localhost variants in development to avoid CORS issues
# when frontend is launched as http://localhost:3000 or http://127.0.0.1:3000.
_dev_origins = {'http://localhost:3000', 'http://127.0.0.1:3000'}
_existing_cors = set(globals().get('CORS_ALLOWED_ORIGINS', []))
CORS_ALLOWED_ORIGINS = sorted(_existing_cors | _dev_origins)

_existing_csrf = set(globals().get('CSRF_TRUSTED_ORIGINS', []))
CSRF_TRUSTED_ORIGINS = sorted(_existing_csrf | _dev_origins)

if not os.getenv('EMAIL_HOST'):
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'Malaika Nest <dev@malaikanest.local>'

CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', CELERY_BROKER_URL)
CELERY_TASK_ALWAYS_EAGER = os.getenv('CELERY_TASK_ALWAYS_EAGER', 'true').strip().lower() in {'1', 'true', 'yes', 'on'}
CELERY_TASK_EAGER_PROPAGATES = True
