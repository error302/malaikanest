import os
from dotenv import load_dotenv

load_dotenv()

try:
    from celery import Celery

    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False

if CELERY_AVAILABLE:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    app = Celery("kenya_baby_ecommerce")
    app.config_from_object("django.conf:settings", namespace="CELERY")
    app.autodiscover_tasks()

    @app.task(bind=True, ignore_result=True)
    def debug_task(self):
        print(f"Request: {self.request!r}")
else:
    app = None
