from urllib.parse import urlparse


def to_bool(value):
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


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

    required_secure_vars = [
        "SECRET_KEY",
        "DATABASE_URL",
        "ALLOWED_HOSTS",
        "FRONTEND_URL",
        "CORS_ALLOWED_ORIGINS",
        "CSRF_TRUSTED_ORIGINS",
        "MPESA_CALLBACK_URL",
        "MPESA_CONSUMER_KEY",
        "MPESA_CONSUMER_SECRET",
        "MPESA_PASSKEY",
        "EMAIL_HOST_USER",
        "EMAIL_HOST_PASSWORD",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
    ]
    missing = [var for var in required_secure_vars if not env.get(var)]
    if missing:
        errors.append(f"Missing required production env vars: {', '.join(missing)}")

    secret_key = env.get("SECRET_KEY", "")
    if len(secret_key) < 32:
        errors.append("SECRET_KEY is too short. Use at least 32 characters.")
    if looks_placeholder(secret_key):
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
        if value and looks_placeholder(value):
            errors.append(f"{var} appears to be a placeholder value.")

    allowed_hosts_raw = env.get("ALLOWED_HOSTS", "")
    if "*" in {host.strip() for host in allowed_hosts_raw.split(",") if host.strip()}:
        errors.append("ALLOWED_HOSTS must not contain '*'.")

    callback_url = env.get("MPESA_CALLBACK_URL", "")
    if callback_url:
        if not callback_url.startswith("https://"):
            errors.append("MPESA_CALLBACK_URL must use https in production.")
        if is_localhost_url(callback_url):
            errors.append("MPESA_CALLBACK_URL must not point to localhost or local network addresses.")

    frontend_url = env.get("FRONTEND_URL", "")
    if frontend_url and (not frontend_url.startswith("https://") or is_localhost_url(frontend_url)):
        errors.append("FRONTEND_URL must be a public https URL in production.")

    if errors:
        joined = "\n- ".join(errors)
        raise RuntimeError(f"Production environment validation failed:\n- {joined}")