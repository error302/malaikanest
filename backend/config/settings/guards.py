import os
from urllib.parse import urlparse


def to_bool(value):
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def enforce_postgresql_only(databases, *, context=""):
    """
    Malaika Nest policy: SQLite is forbidden. PostgreSQL is mandatory.

    We intentionally fail fast at import-time if any environment/config attempts
    to use a non-PostgreSQL Django database engine.
    """

    default_db = (databases or {}).get("default") or {}
    engine = str(default_db.get("ENGINE") or "").strip()
    allowed = {"django.db.backends.postgresql", "django.db.backends.postgis"}
    if engine not in allowed:
        hint = f" ({context})" if context else ""
        raise RuntimeError(
            "Invalid database engine configured"
            f"{hint}: ENGINE={engine!r}. This project requires PostgreSQL only."
        )


def is_localhost_url(value):
    if not value:
        return False
    try:
        parsed = urlparse(value)
    except Exception:
        return True
    hostname = (parsed.hostname or "").lower()
    return hostname in {"localhost", "127.0.0.1", "0.0.0.0", "::1"} or hostname.endswith('.local')


def looks_placeholder(value):
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


def validate_production_env(env):
    errors = []

    env_name = str(env.get("ENVIRONMENT", "development")).strip().lower()
    is_production = env_name in {"production", "prod", "live"} or to_bool(env.get("DJANGO_PRODUCTION", "False"))
    if not is_production:
        return

    if to_bool(env.get("DEBUG", "False")):
        errors.append("DEBUG must be False in production.")

    # Only enforce vars that have no computed fallback in prod.py.
    # DATABASE_URL is optional because individual DB_* vars are also supported.
    # FRONTEND_URL, CORS_ALLOWED_ORIGINS, CSRF_TRUSTED_ORIGINS have computed defaults.
    required_secure_vars = [
        "SECRET_KEY",
        "ALLOWED_HOSTS",
        "EMAIL_HOST_USER",
        "EMAIL_HOST_PASSWORD",
    ]
    missing = [var for var in required_secure_vars if not env.get(var)]
    if missing:
        errors.append(f"Missing required production env vars: {', '.join(missing)}")

    # Cloudinary is mandatory for production media. Allow either CLOUDINARY_URL or split vars.
    cloudinary_url = (env.get("CLOUDINARY_URL") or "").strip()
    cloud_name = env.get("CLOUDINARY_CLOUD_NAME") or env.get("CLOUDINARY_NAME")
    api_key = env.get("CLOUDINARY_API_KEY") or env.get("CLOUDINARY_KEY")
    api_secret = env.get("CLOUDINARY_API_SECRET") or env.get("CLOUDINARY_SECRET")
    cloudinary_ok = bool(cloudinary_url) or bool(cloud_name and api_key and api_secret)
    if not cloudinary_ok:
        errors.append(
            "Missing Cloudinary credentials: set CLOUDINARY_URL or "
            "CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET."
        )

    secret_key = env.get("SECRET_KEY", "")
    if len(secret_key) < 32:
        errors.append("SECRET_KEY is too short. Use at least 32 characters.")
    if looks_placeholder(secret_key):
        errors.append("SECRET_KEY appears to be a placeholder value.")

    for var in [
        "EMAIL_HOST_PASSWORD",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
    ]:
        value = env.get(var)
        if value and looks_placeholder(value):
            errors.append(f"{var} appears to be a placeholder value.")

    allowed_hosts_raw = env.get("ALLOWED_HOSTS", "")
    if "*" in {host.strip() for host in allowed_hosts_raw.split(",") if host.strip()}:
        errors.append("ALLOWED_HOSTS must not contain '*'.")

    # M-Pesa is payment-critical: production must never run in mock mode (which
    # auto-completes payments with no money movement) or on placeholder
    # credentials, and callbacks must be cryptographically signature-verified.
    mpesa_consumer_key = env.get("MPESA_CONSUMER_KEY", "")
    mpesa_consumer_secret = env.get("MPESA_CONSUMER_SECRET", "")
    mpesa_passkey = env.get("MPESA_PASSKEY", "")
    callback_url = env.get("MPESA_CALLBACK_URL", "")
    mpesa_shortcode = env.get("MPESA_SHORTCODE", "") or env.get("MPESA_BUSINESS_SHORT_CODE", "")
    mpesa_values = [mpesa_consumer_key, mpesa_consumer_secret, mpesa_passkey, callback_url, mpesa_shortcode]
    if any(not v or looks_placeholder(v) for v in mpesa_values):
        errors.append(
            "M-Pesa credentials are missing or placeholder values. Refusing to serve "
            "production: set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, "
            "MPESA_SHORTCODE and MPESA_CALLBACK_URL to real values."
        )
    else:
        if not callback_url.startswith("https://"):
            errors.append("MPESA_CALLBACK_URL must use https in production.")
        if is_localhost_url(callback_url):
            errors.append("MPESA_CALLBACK_URL must not point to localhost or local network addresses.")

    if to_bool(env.get("MPESA_MOCK_MODE", "")):
        errors.append(
            "MPESA_MOCK_MODE must be disabled in production: mock mode marks orders "
            "paid without any real M-Pesa transaction."
        )

    if not to_bool(env.get("MPESA_STRICT_SIGNATURE", "")):
        errors.append(
            "MPESA_STRICT_SIGNATURE must be enabled in production so M-Pesa callbacks "
            "are verified against Safaricom's public key instead of trusted by IP address."
        )
    else:
        public_key_path = str(env.get("MPESA_PUBLIC_KEY_PATH", "") or "").strip()
        if not public_key_path:
            errors.append(
                "MPESA_PUBLIC_KEY_PATH must point to the Safaricom public certificate "
                "when MPESA_STRICT_SIGNATURE is enabled."
            )
        elif not os.path.isfile(public_key_path):
            errors.append(f"MPESA_PUBLIC_KEY_PATH does not point to a readable file: {public_key_path}")

    frontend_url = env.get("FRONTEND_URL", "")
    if frontend_url and (not frontend_url.startswith("https://") or is_localhost_url(frontend_url)):
        errors.append("FRONTEND_URL must be a public https URL in production.")

    if errors:
        joined = "\n- ".join(errors)
        raise RuntimeError(f"Production environment validation failed:\n- {joined}")
