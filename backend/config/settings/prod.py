from .base import *
import urllib.parse

from .guards import validate_production_env

DEBUG = False

ALLOWED_HOSTS = [
    h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()
] + ["127.0.0.1", "localhost"]

# Redis cache configuration for high scalability
REDIS_URL = os.getenv(
    "REDIS_URL", os.getenv("REDIS_TLS_URL", "redis://127.0.0.1:6379/0")
)

# Use Django's built-in Redis cache backend
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "KEY_PREFIX": "malaika",
        "TIMEOUT": 300,
    },
    "banners": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "TIMEOUT": 3600,
        "KEY_PREFIX": "malaika_banners",
    },
    "categories": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "TIMEOUT": 3600,
        "KEY_PREFIX": "malaika_categories",
    },
    "products": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "TIMEOUT": 300,
        "KEY_PREFIX": "malaika_products",
    },
}

# Database connection pooling for high traffic
DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "20"))
DATABASE_MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "10"))

# Cloudinary configuration for image uploads
_cloudinary_url = os.getenv("CLOUDINARY_URL", "").strip()

# Support both split Cloudinary vars and CLOUDINARY_URL. Also accept legacy names.
_cloud_name = (
    os.getenv("CLOUDINARY_CLOUD_NAME")
    or os.getenv("CLOUDINARY_NAME")
    or os.getenv("CLOUDINARY_CLOUD")
)
_api_key = os.getenv("CLOUDINARY_API_KEY") or os.getenv("CLOUDINARY_KEY")
_api_secret = os.getenv("CLOUDINARY_API_SECRET") or os.getenv("CLOUDINARY_SECRET")

if not _cloudinary_url and _cloud_name and _api_key and _api_secret:
    _cloudinary_url = f"cloudinary://{_api_key}:{_api_secret}@{_cloud_name}"

# Ensure the underlying Cloudinary SDK can read credentials consistently.
if _cloudinary_url:
    os.environ.setdefault("CLOUDINARY_URL", _cloudinary_url)

CLOUDINARY_CLOUD_NAME = _cloud_name
CLOUDINARY_API_KEY = _api_key
CLOUDINARY_API_SECRET = _api_secret

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    CLOUDINARY_STORAGE = {
        "CLOUD_NAME": CLOUDINARY_CLOUD_NAME,
        "API_KEY": CLOUDINARY_API_KEY,
        "API_SECRET": CLOUDINARY_API_SECRET,
    }

# Use Cloudinary for media storage
STORAGES = {
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Support both DATABASE_URL and individual DB_* variables
database_url = os.getenv("DATABASE_URL")

def _db_sslmode(hostname: str | None) -> str:
    host = (hostname or "").strip().lower()
    # Local Postgres on the VM typically doesn't have SSL configured.
    if host in {"localhost", "127.0.0.1", "::1"} or host.endswith(".local"):
        return "disable"
    return "require"

if database_url:
    # Parse DATABASE_URL format: postgresql://user:password@host:port/dbname
    parsed = urllib.parse.urlparse(database_url)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path[1:] if parsed.path else "postgres",
            "USER": parsed.username,
            "PASSWORD": parsed.password,
            "HOST": parsed.hostname,
            "PORT": parsed.port or 5432,
            "CONN_MAX_AGE": 60,
            "OPTIONS": {
                "sslmode": _db_sslmode(parsed.hostname),
                "connect_timeout": 10,
            },
            "POOL_SIZE": DATABASE_POOL_SIZE,
            "MAX_OVERFLOW": DATABASE_MAX_OVERFLOW,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME"),
            "USER": os.getenv("DB_USER"),
            "PASSWORD": os.getenv("DB_PASSWORD"),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
            "CONN_MAX_AGE": 60,
            "OPTIONS": {
                "sslmode": _db_sslmode(os.getenv("DB_HOST", "localhost")),
                "connect_timeout": 10,
            },
            "POOL_SIZE": DATABASE_POOL_SIZE,
            "MAX_OVERFLOW": DATABASE_MAX_OVERFLOW,
        }
    }

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Admin session persistence - keep admin logged in
SESSION_COOKIE_AGE = 60 * 60 * 24 * 30  # 30 days
SESSION_SAVE_EVERY_REQUEST = False
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# CSRF settings
CSRF_COOKIE_AGE = 60 * 60 * 24 * 30  # 30 days

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

LOGGING["handlers"]["file"]["level"] = "WARNING"
LOGGING["loggers"]["django"]["level"] = "WARNING"

validate_production_env(os.environ)

if DATABASES["default"]["NAME"] != "malaika_db":
    raise Exception("Invalid database configuration. This project must use malaika_db.")

print("Running in PRODUCTION mode")
