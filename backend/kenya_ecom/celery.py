import os
from dotenv import load_dotenv

load_dotenv()

try:
    from celery import Celery

    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False

if CELERY_AVAILABLE:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "kenya_ecom.settings")
    app = Celery("kenya_ecom")
    app.config_from_object("django.conf:settings", namespace="CELERY")
    app.autodiscover_tasks()

    @app.task(bind=True)
    def debug_task(self):
        print(f"Request: {self.request!r}")
else:
    app = None
