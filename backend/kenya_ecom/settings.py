import os
import importlib.util
from pathlib import Path
from datetime import timedelta
from urllib.parse import urlparse
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_env_files():
    """Load readable env files only to avoid permission errors for non-root shells."""
    candidates = [BASE_DIR / ".env.production", BASE_DIR / ".env"]
    for env_path in candidates:
        try:
            if env_path.exists() and os.access(env_path, os.R_OK):
                load_dotenv(dotenv_path=env_path, override=False)
        except OSError:
            # Ignore unreadable env files; systemd EnvironmentFile may already supply vars.
            continue


_load_env_files()


def _to_bool(value):
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _is_localhost_url(value):
    if not value:
        return False
    try:
        parsed = urlparse(value)
    except Exception:
        return True
    hostname = (parsed.hostname or "").lower()
    return hostname in {"localhost", "127.0.0.1", "0.0.0.0", "::1"} or hostname.endswith(".local")


def _looks_placeholder(value):
    if value is None:
        return True
    normalized = str(value).strip().lower()
    if not normalized:
        return True
    placeholder_tokens = (
        "changeme",
        "change-me",
        "placeholder",
        "replace_me",
        "replace-me",
        "example",
        "dummy",
        "your-",
        "your_",
        "default",
        "sample",
        "test",
    )
    return any(token in normalized for token in placeholder_tokens)


ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
IS_PRODUCTION = ENVIRONMENT in {"production", "prod", "live"} or _to_bool(
    os.getenv("DJANGO_PRODUCTION", "False")
)
DEBUG = _to_bool(os.getenv("DEBUG", "False"))


def validate_production_env(env):
    errors = []
    warnings = []

    env_name = str(env.get("ENVIRONMENT", "development")).strip().lower()
    is_production = env_name in {"production", "prod", "live"} or _to_bool(env.get("DJANGO_PRODUCTION", "False"))
    if not is_production:
        return

    if _to_bool(env.get("DEBUG", "False")):
        errors.append("DEBUG must be False in production.")

    required_secure_vars = [
        "SECRET_KEY",
        "DATABASE_URL",
        "ALLOWED_HOSTS",
        "FRONTEND_URL",
        "CORS_ALLOWED_ORIGINS",
        "CSRF_TRUSTED_ORIGINS",
    ]
    missing = [var for var in required_secure_vars if not env.get(var)]
    if missing:
        errors.append(f"Missing required production env vars: {', '.join(missing)}")

    # Integration vars are enforced only if that integration is configured/enabled.
    mpesa_vars = ["MPESA_CALLBACK_URL", "MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_PASSKEY"]
    mpesa_present = [var for var in mpesa_vars if env.get(var)]
    if mpesa_present and len(mpesa_present) != len(mpesa_vars):
        warnings.append("Incomplete M-Pesa configuration. MPESA features may be unavailable until all MPESA_* vars are set.")

    email_vars = ["EMAIL_HOST_USER", "EMAIL_HOST_PASSWORD", "DEFAULT_FROM_EMAIL"]
    email_present = [var for var in email_vars if env.get(var)]
    if email_present and len(email_present) != len(email_vars):
        warnings.append("Incomplete email configuration. Email sending may fail until EMAIL_* vars and DEFAULT_FROM_EMAIL are set.")

    cloudinary_vars = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]
    cloudinary_present = [var for var in cloudinary_vars if env.get(var)]
    if cloudinary_present and len(cloudinary_present) != len(cloudinary_vars):
        warnings.append("Incomplete Cloudinary configuration. Media uploads may fail until all CLOUDINARY_* vars are set.")

    secret_key = env.get("SECRET_KEY", "")
    if len(secret_key) < 32:
        errors.append("SECRET_KEY is too short. Use at least 32 characters.")
    if _looks_placeholder(secret_key):
        errors.append("SECRET_KEY appears to be a placeholder value.")

    for var in [
        "MPESA_CONSUMER_KEY",
        "MPESA_CONSUMER_SECRET",
        "MPESA_PASSKEY",
        "EMAIL_HOST_PASSWORD",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
    ]:
        value = env.get(var)
        if value and _looks_placeholder(value):
            errors.append(f"{var} appears to be a placeholder value.")

    allowed_hosts_raw = env.get("ALLOWED_HOSTS", "")
    if "*" in {host.strip() for host in allowed_hosts_raw.split(",") if host.strip()}:
        errors.append("ALLOWED_HOSTS must not contain '*'.")

    callback_url = env.get("MPESA_CALLBACK_URL", "")
    if callback_url:
        if not callback_url.startswith("https://"):
            errors.append("MPESA_CALLBACK_URL must use https in production.")
        if _is_localhost_url(callback_url):
            errors.append("MPESA_CALLBACK_URL must not point to localhost or local network addresses.")

    frontend_url = env.get("FRONTEND_URL", "")
    if frontend_url and (not frontend_url.startswith("https://") or _is_localhost_url(frontend_url)):
        errors.append("FRONTEND_URL must be a public https URL in production.")

    if errors:
        joined = "\n- ".join(errors)
        raise RuntimeError(f"Production environment validation failed:\n- {joined}")
    if warnings:
        for warning_message in warnings:
            print(f"[WARNING] {warning_message}")


validate_production_env(os.environ)

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set in environment variables")

# ============================================================================
# HOST VALIDATION - Prevent host header attacks
# ============================================================================
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
ALLOWED_HOSTS = [h.strip() for h in ALLOWED_HOSTS if h.strip()]

# Frontend URL - used for password reset links, etc.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")

# Validate against open redirect attacks
VALID_REDIRECT_HOSTS = os.getenv("VALID_REDIRECT_HOSTS", "").split(",")
VALID_REDIRECT_HOSTS = [h.strip() for h in VALID_REDIRECT_HOSTS if h.strip()]

# If no explicit redirect hosts, use allowed hosts
if not VALID_REDIRECT_HOSTS:
    VALID_REDIRECT_HOSTS = ALLOWED_HOSTS

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "apps.accounts",
    "apps.products",
    "apps.orders",
    "apps.payments",
    "apps.core",
    "apps.ai",
]

if importlib.util.find_spec("cloudinary"):
    INSTALLED_APPS.append("cloudinary")
elif IS_PRODUCTION:
    raise RuntimeError("cloudinary package must be installed in production.")

if importlib.util.find_spec("django_filters"):
    INSTALLED_APPS.append("django_filters")
elif IS_PRODUCTION:
    raise RuntimeError("django-filter package must be installed in production.")
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
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

ROOT_URLCONF = "kenya_ecom.urls"

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
            "builtins": [
                "django.template.defaultfilters",
            ],
        },
    },
]

WSGI_APPLICATION = "kenya_ecom.wsgi.application"
ASGI_APPLICATION = "kenya_ecom.asgi.application"

# Database - with connection pooling for security
try:
    import dj_database_url
except ModuleNotFoundError:
    dj_database_url = None

database_url = os.getenv("DATABASE_URL")
if database_url:
    try:
        if dj_database_url is not None:
            DATABASES = {
                "default": dj_database_url.parse(
                    database_url,
                    conn_max_age=60,
                    conn_health_checks=True,
                )
            }
        else:
            parsed = urlparse(database_url)
            DATABASES = {
                "default": {
                    "ENGINE": "django.db.backends.postgresql",
                    "NAME": parsed.path[1:] if parsed.path else "malaika_db",
                    "USER": parsed.username,
                    "PASSWORD": parsed.password,
                    "HOST": parsed.hostname,
                    "PORT": parsed.port or 5432,
                    "CONN_MAX_AGE": 60,
                    "OPTIONS": {
                        "sslmode": "require",
                    },
                }
            }
    except Exception:
        parsed = urlparse(database_url)
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": parsed.path[1:] if parsed.path else "malaika_db",
                "USER": parsed.username,
                "PASSWORD": parsed.password,
                "HOST": parsed.hostname,
                "PORT": parsed.port or 5432,
                "CONN_MAX_AGE": 60,
                "OPTIONS": {
                    "sslmode": "require",
                },
            }
        }
else:
    if IS_PRODUCTION:
        raise RuntimeError("DATABASE_URL must be set in production.")
    print("[WARNING] DATABASE_URL is NOT set, falling back to SQLite")
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "test_db.sqlite3",
        }
    }

# Password validation - Enhanced
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

AUTH_USER_MODEL = "accounts.User"

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Static and media
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Cloudinary - Secure configuration
CLOUDINARY_ENABLED = bool(importlib.util.find_spec("cloudinary") and importlib.util.find_spec("cloudinary_storage"))
if CLOUDINARY_ENABLED:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api

    cloudinary.config(
        cloudinary_url=os.getenv("CLOUDINARY_URL", ""),
        secure=True,
        ssl_verify=True,
    )

    CLOUDINARY_STORAGE = {
        "CLOUD_NAME": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "API_KEY": os.getenv("CLOUDINARY_API_KEY"),
        "API_SECRET": os.getenv("CLOUDINARY_API_SECRET"),
    }

    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"
    MEDIA_URL = "/media/"
elif IS_PRODUCTION:
    raise RuntimeError("cloudinary_storage package must be installed in production.")
# ============================================================================
# REST Framework + JWT - SECURE CONFIGURATION
# ============================================================================
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
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "200/hour",
        "password_reset": "3/hour",
    },
    "DEFAULT_RENDERER_CLASSES": ("apps.core.renderers.StandardJSONRenderer",),
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 24,
}

# JWT Configuration - SHORT access token, long refresh with rotation
# HIGH-01: Reduced ACCESS_TOKEN_LIFETIME from 7 days to 15 minutes.
# Access tokens cannot be revoked (stateless JWT); 7 days = week-long compromise window.
# The httpOnly cookie + refresh rotation handles seamless renewal.
SIMPLE_JWT = {
    "ALGORITHM": "HS256",
    "SIGNING_KEY": os.getenv("JWT_SIGNING_KEY", os.getenv("SECRET_KEY")),
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_COOKIE": "refresh_token",
    "AUTH_COOKIE_SECURE": True,
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_SAMESITE": "Lax",
    "AUTH_COOKIE_DOMAIN": os.getenv("AUTH_COOKIE_DOMAIN", None),
    "TOKEN_OBTAIN_SERIALIZER": "apps.accounts.serializers.TokenObtainPairWithUserSerializer",
}

# ============================================================================
# CORS - Strict Allowlist Configuration
# ============================================================================
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000,https://localhost:3000"
).split(",")
CORS_ALLOWED_ORIGINS = [u.strip() for u in CORS_ALLOWED_ORIGINS if u.strip()]


# Validate all origins have proper scheme
def validate_origin(origin):
    """Validate origin has https in production"""
    if DEBUG:
        return origin
    # In production, require HTTPS
    if not origin.startswith(("http://", "https://")):
        return f"https://{origin}"
    return origin


CORS_ALLOWED_ORIGINS = [validate_origin(u) for u in CORS_ALLOWED_ORIGINS]

# Disallow credentials from other origins in production
CORS_ALLOW_CREDENTIALS = True

# Explicitly whitelist methods
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# Explicitly whitelist headers
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# CSRF trusted origins
CSRF_TRUSTED_ORIGINS = os.getenv(
    "CSRF_TRUSTED_ORIGINS", ",".join(CORS_ALLOWED_ORIGINS)
).split(",")
CSRF_TRUSTED_ORIGINS = [u.strip() for u in CSRF_TRUSTED_ORIGINS if u.strip()]
CSRF_TRUSTED_ORIGINS = [validate_origin(u) for u in CSRF_TRUSTED_ORIGINS]

# ============================================================================
# SECURITY HEADERS
# ============================================================================
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = IS_PRODUCTION
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Cookie security
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"

# X-Frame-Options
X_FRAME_OPTIONS = "DENY"

# Additional security headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# Content Security Policy
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'" if DEBUG else "'self'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'" if DEBUG else "'self'")
CSP_IMG_SRC = ("'self'", "data:", "https:", "blob:")
CSP_FONT_SRC = ("'self'", "data:")
CSP_CONNECT_SRC = ("'self'",)
CSP_FRAME_ANCESTORS = ("'none'",)

# ============================================================================
# EMAIL - Gmail SMTP Configuration
# ============================================================================
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend"
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL")

# ============================================================================
# LOGGING - Secure Configuration
# ============================================================================
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s"
        },
        "json": {
            "format": "%(message)s",
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
        "security": {
            "level": "WARNING",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "security.log",
            "maxBytes": 1024 * 1024 * 5,
            "backupCount": 3,
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {"handlers": ["file"], "level": "INFO", "propagate": True},
        "apps": {"handlers": ["file"], "level": "INFO", "propagate": True},
        "security": {"handlers": ["security"], "level": "WARNING", "propagate": True},
    },
}

# ============================================================================
# CACHE - Redis in configured environments, local memory fallback otherwise
# ============================================================================
redis_cache_url = os.getenv("REDIS_URL", "").strip()
if redis_cache_url:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": redis_cache_url,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "malaikanest-local-cache",
        }
    }

# ============================================================================
# CHANNELS - Redis for WebSockets
# ============================================================================
redis_url = os.getenv("REDIS_URL")
if redis_url:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [redis_url],
            },
        }
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }

# ============================================================================
# RATE LIMITING
# ============================================================================
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = "default"

# CAPTCHA (Turnstile/Recaptcha)
CAPTCHA_PROVIDER = os.getenv("CAPTCHA_PROVIDER", "turnstile")
CAPTCHA_SECRET_KEY = os.getenv("CAPTCHA_SECRET_KEY", "")
CAPTCHA_VERIFY_URL = os.getenv("CAPTCHA_VERIFY_URL", "")
CAPTCHA_TIMEOUT_SECONDS = int(os.getenv("CAPTCHA_TIMEOUT_SECONDS", "8"))
CAPTCHA_ENFORCE_LOGIN = _to_bool(os.getenv("CAPTCHA_ENFORCE_LOGIN", "True" if IS_PRODUCTION else "False"))
CAPTCHA_ENFORCE_REGISTER = _to_bool(os.getenv("CAPTCHA_ENFORCE_REGISTER", "True" if IS_PRODUCTION else "False"))

# ============================================================================
# MISC
# ============================================================================
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Ensure logs directory exists
try:
    LOG_DIR = BASE_DIR / "logs"
    LOG_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

# AI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
AI_TEMPERATURE = float(os.getenv("AI_TEMPERATURE", "0.7"))
AI_MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "1000"))

# ============================================================================
# AUTO-CREATE SUPERUSER (Only in non-production)
# ============================================================================
if os.getenv("CREATE_SUPERUSER", "false").lower() == "true" and not DEBUG:
    from django.contrib.auth import get_user_model

    User = get_user_model()
    superuser_email = os.getenv("SUPERUSER_EMAIL")
    superuser_password = os.getenv("SUPERUSER_PASSWORD")

    if superuser_email and superuser_password:
        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser(superuser_email, superuser_password)
















