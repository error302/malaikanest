import os
from pathlib import Path
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured
from corsheaders.defaults import default_headers

# Load environment variables from the environment-specific dotenv file.
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

settings_module = os.getenv("DJANGO_SETTINGS_MODULE", "")
production_env_requested = (
    os.getenv("DJANGO_ENV", "").lower() == "prod"
    or os.getenv("ENVIRONMENT", "").lower() == "production"
    or os.getenv("DJANGO_PRODUCTION", "").lower() in {"1", "true", "yes"}
    or settings_module.endswith(".prod")
)

env_files = [BASE_DIR / ".env"]
if production_env_requested:
    env_files = [BASE_DIR / ".env.production", *env_files]

for env_file in env_files:
    if env_file.exists():
        load_dotenv(env_file, override=False)

def get_env_or_crash(var_name):
    import os
    from django.core.exceptions import ImproperlyConfigured
    val = os.getenv(var_name)
    if not val:
        raise ImproperlyConfigured(f"{var_name} environment variable is strictly required by the Behavioral Contract.")
    return val

SECRET_KEY = get_env_or_crash("SECRET_KEY")

# Admin URL prefix (default: /manage-store/). Backwards-compatible with legacy ADMIN_URL_SECRET.
ADMIN_URL_PREFIX = (os.getenv("ADMIN_URL_PREFIX") or os.getenv("ADMIN_URL_SECRET") or "manage-store").strip("/")

ALLOWED_HOSTS = [
    h.strip() for h in os.getenv("ALLOWED_HOSTS", "localhost").split(",") if h.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "corsheaders",
    "django_celery_beat",
    # Cloudinary media storage backend (used in prod via STORAGES["default"]).
    "cloudinary_storage",
    "cloudinary",
    "channels",
    "apps.accounts",
    "apps.products",
    "apps.orders",
    "apps.payments",
    "apps.core",
    "apps.ai",
]

MIDDLEWARE = [
    "django.middleware.gzip.GZipMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "apps.core.middleware.SecurityHeadersMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.core.middleware.RateLimitMiddleware",
    "apps.core.middleware.RequestLoggingMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")]},
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTH_USER_MODEL = "accounts.User"

# Custom authentication backend for email-based login
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.accounts.authentication.CookieJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "1200/hour",
        "user": "5000/hour",
        "payments": "10/minute",
        "login": "5/minute",
        "password_reset": "5/hour",
        "cart": "60/minute",  # Cart operations
        "order": "20/minute",  # Order operations
    },
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 24,
    "DEFAULT_RENDERER_CLASSES": [
        "apps.core.renderers.StandardJSONRenderer",
    ],
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}

SIMPLE_JWT = {
    "ALGORITHM": "HS256",
    "SIGNING_KEY": os.getenv("SIMPLE_JWT_SECRET") or SECRET_KEY,
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("ACCESS_TOKEN_MINUTES", "15"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("REFRESH_TOKEN_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_COOKIE": "refresh_token",
    "AUTH_COOKIE_SECURE": os.getenv("AUTH_COOKIE_SECURE", "true").strip().lower() in {"1", "true", "yes", "on"},
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_SAMESITE": os.getenv("AUTH_COOKIE_SAMESITE", "Strict"),
}

# Optional cookie domain so auth works across www/non-www.
# Example: ".malaikanest.duckdns.org"
AUTH_COOKIE_DOMAIN = os.getenv("AUTH_COOKIE_DOMAIN") or None

_cors_env = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
CORS_ALLOWED_ORIGINS = [u.strip() for u in _cors_env.split(",") if u.strip()]

# Essential for session cookies (guest cart) and HTTPOnly JWTs to work across domains
CORS_ALLOW_CREDENTIALS = True

# Allow common cache headers sent by browsers/proxies during CORS preflight.
CORS_ALLOW_HEADERS = list(default_headers) + [
    "cache-control",
    "pragma",
    "expires",
]

_csrf_env = os.getenv("CSRF_TRUSTED_ORIGINS", "")
if _csrf_env:
    CSRF_TRUSTED_ORIGINS = [u.strip() for u in _csrf_env.split(",") if u.strip()]
else:

    def _ensure_scheme(origin):
        return origin if origin.startswith("http") else f"https://{origin}"

    CSRF_TRUSTED_ORIGINS = [_ensure_scheme(u) for u in CORS_ALLOWED_ORIGINS]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = get_env_or_crash("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_HOST_USER = get_env_or_crash("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = get_env_or_crash("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True") == "True"
DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL", "Malaika Nest <malaikanest7@gmail.com>"
)

# Redis + Celery
REDIS_URL = os.getenv("REDIS_URL", os.getenv("REDIS_TLS_URL", "redis://127.0.0.1:6379/0"))
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", CELERY_BROKER_URL)
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_ENABLE_UTC = True
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_TRACK_STARTED = True

CELERY_BEAT_SCHEDULE = {
    # Reconcile any M-Pesa payments where the callback was missed or delayed.
    # Runs every 15 minutes — catches payments that have been initiated but
    # have no callback after 5+ minutes.  Limit 500 prevents runaway queries.
    "payments-reconcile-every-15-min": {
        "task": "apps.payments.tasks.reconcile_payments_task",
        "schedule": timedelta(minutes=15),
        "args": (5, 500),
    },
    "cleanup-old-guest-carts-hourly": {
        "task": "apps.orders.tasks.cleanup_old_guest_carts",
        "schedule": timedelta(hours=1),
    },
    "products-low-stock-daily": {
        "task": "apps.products.tasks.low_stock_check",
        "schedule": timedelta(days=1),
    },
}

# Default DB pooling value used by dev/prod settings.
DB_CONN_MAX_AGE = int(os.getenv("DB_CONN_MAX_AGE", "600"))

# Media storage: filesystem by default; switch to Cloudinary when configured.
_cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME") or os.getenv("CLOUDINARY_NAME") or os.getenv("CLOUDINARY_CLOUD")
_cloud_key = os.getenv("CLOUDINARY_API_KEY") or os.getenv("CLOUDINARY_KEY")
_cloud_secret = os.getenv("CLOUDINARY_API_SECRET") or os.getenv("CLOUDINARY_SECRET")

if _cloud_name and _cloud_key and _cloud_secret:
    try:
        import cloudinary

        cloudinary.config(
            cloud_name=_cloud_name,
            api_key=_cloud_key,
            api_secret=_cloud_secret,
            secure=True,
            force_version=False,
        )
        STORAGES = {
            "default": {"BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"},
            "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
        }
    except Exception:
        STORAGES = {
            "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
            "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
        }
else:
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }

# Baseline security (prod overrides tighten).
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
X_FRAME_OPTIONS = "DENY"

# Custom: where the frontend should send missing-content traffic.
CONTENT_NOT_FOUND_URL = os.getenv("CONTENT_NOT_FOUND_URL", "/")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "kenya_ecom.log",
            "maxBytes": 1024 * 1024 * 10,
            "backupCount": 5,
            "formatter": "verbose",
        },
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["file", "console"],
            "level": "INFO",
            "propagate": True,
        },
        "apps": {
            "handlers": ["file", "console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

try:
    LOG_DIR = BASE_DIR / "logs"
    LOG_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass
