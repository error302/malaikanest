import re
from django.core.exceptions import ValidationError


def get_client_ip(request):
    """Return the true client IP for rate limiting, lockout and audit decisions.

    Trust model: all production ingress reaches Django through Cloudflare Tunnel.
    Cloudflare's edge sets/overwrites CF-Connecting-IP on every proxied request,
    so clients cannot forge it through the proxy; cloudflared forwards it as-is.
    X-Real-IP and left-most X-Forwarded-For hops are attacker-controlled and must
    never be trusted. Fallbacks cover local development where no proxy is present.
    """
    cf_ip = request.META.get("HTTP_CF_CONNECTING_IP")
    if cf_ip:
        return cf_ip.strip()
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[-1].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def validate_kenyan_phone(phone):
    """
    Validate Kenyan phone number format.
    Accepts: 2547XXXXXXXX, 07XXXXXXXX, +2547XXXXXXXX
    Returns: normalized 2547XXXXXXXX format
    """
    if not phone:
        raise ValidationError("Phone number is required")
    
    digits = re.sub(r'\D', '', phone)
    
    if len(digits) == 10 and digits.startswith('0'):
        digits = '254' + digits[1:]
    elif len(digits) == 9:
        digits = '254' + digits
    elif len(digits) == 12 and digits.startswith('254'):
        pass
    else:
        raise ValidationError("Invalid Kenyan phone number format")
    
    if not digits.startswith('254'):
        raise ValidationError("Phone must be a Kenyan number")
    
    valid_prefixes = ('25470', '25471', '25472', '25473', '25474', '25475', '25476', '25477', '25478', '25479',
                      '25410', '25411', '25412', '25413', '25414', '25415', '25416', '25417', '25418', '25419')
    if not any(digits.startswith(prefix) for prefix in valid_prefixes):
        raise ValidationError("Invalid Kenyan mobile number prefix")
    
    return digits


def format_kenyan_phone(phone):
    """Format phone number for display"""
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('254'):
        return '+' + digits
    elif len(digits) == 9:
        return '0' + digits
    return phone


def generate_receipt_number():
    """Generate unique receipt number"""
    import uuid
    from datetime import datetime
    timestamp = datetime.now().strftime('%Y%m%d')
    unique = uuid.uuid4().hex[:8].upper()
    return f"KBS-{timestamp}-{unique}"


def is_safe_external_url(url: str) -> bool:
    """Validate that a URL points to an external, routable public destination (SSRF protection)."""
    if not url:
        return False
    try:
        from urllib.parse import urlparse
        import socket
        import ipaddress

        parsed = urlparse(url)
        if parsed.scheme.lower() not in ("http", "https"):
            return False
        hostname = (parsed.hostname or "").strip().lower()
        if not hostname:
            return False

        blocked_hostnames = {"localhost", "metadata.google.internal", "instance-data"}
        if hostname in blocked_hostnames or hostname.endswith(".internal") or hostname.endswith(".local"):
            return False

        addr_info = socket.getaddrinfo(hostname, None)
        if not addr_info:
            return False

        for item in addr_info:
            ip_str = item[4][0]
            ip = ipaddress.ip_address(ip_str)
            if (
                ip.is_loopback
                or ip.is_private
                or ip.is_link_local
                or ip.is_reserved
                or ip.is_multicast
                or ip.is_unspecified
            ):
                return False
        return True
    except Exception:
        return False


def safe_download_image(image_url: str, max_size_bytes: int = 5 * 1024 * 1024):
    """
    Downloads an image from an external URL with strict SSRF protection,
    streaming byte cap, and Pillow image verification.
    """
    if not is_safe_external_url(image_url):
        return None

    try:
        import io
        import requests
        from urllib.parse import urlparse
        from django.core.files.base import ContentFile
        from PIL import Image

        session = requests.Session()
        resp = session.get(image_url, stream=True, timeout=10, allow_redirects=False)
        if resp.status_code != 200:
            return None

        chunks = []
        downloaded = 0
        for chunk in resp.iter_content(chunk_size=65536):
            downloaded += len(chunk)
            if downloaded > max_size_bytes:
                return None
            chunks.append(chunk)

        content = b"".join(chunks)
        if not content:
            return None

        # Verify image content using Pillow
        img = Image.open(io.BytesIO(content))
        img.verify()
        img_format = (img.format or "JPEG").lower()
        if img_format not in ("jpeg", "jpg", "png", "webp", "gif"):
            return None

        parsed = urlparse(image_url)
        raw_name = parsed.path.split("/")[-1] if parsed.path else "image"
        filename = raw_name.split("?")[0] or f"image.{img_format}"
        if not any(filename.lower().endswith(f".{ext}") for ext in ("jpg", "jpeg", "png", "webp", "gif")):
            filename = f"{filename}.{img_format}"

        return ContentFile(content, name=filename)
    except Exception:
        return None
