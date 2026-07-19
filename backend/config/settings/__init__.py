import os

env = os.getenv('DJANGO_ENV', 'dev').strip().lower()

if env in ('prod', 'production', 'live'):
    from .prod import *
else:
    from .dev import *
