import sys
from .celery import app as celery_app

# Python 3.14 compatibility shim for Django 5.1 BaseContext.__copy__
if sys.version_info >= (3, 14):
    try:
        import django.template.context

        def _base_context_copy(self):
            cls = self.__class__
            duplicate = cls.__new__(cls)
            duplicate.__dict__.update(self.__dict__)
            duplicate.dicts = self.dicts[:]
            return duplicate

        django.template.context.BaseContext.__copy__ = _base_context_copy
    except ImportError:
        pass

__all__ = ("celery_app",)
