from .settings import *

# Use fast, local sqlite DB for tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',
    }
}

# Use console email backend for tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Run celery tasks eagerly for tests
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Reduce logging noise
LOGGING['handlers']['file']['level'] = 'ERROR'

# Ensure a default SECRET_KEY for local test runs
if not globals().get('SECRET_KEY'):
    SECRET_KEY = os.environ.get('SECRET_KEY', 'test-secret')

# Enable DEBUG and local hosts for convenient local smoke tests
DEBUG = True
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']
