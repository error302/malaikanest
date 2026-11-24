import re
from django import template
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

register = template.Library()

CLOUDINARY_UPLOAD_PATTERN = re.compile(r"https?://res\.cloudinary\.com/[^/]+/image/upload/")


@register.filter
def optimize_cloudinary_url(url: str, options: str = "f_auto,q_auto") -> str:
    """
    Add Cloudinary transformation parameters to a Cloudinary URL.
    
    Usage in template:
        {{ product.get_image_url|optimize_cloudinary_url:"f_auto,q_auto,w_800" }}
    
    Args:
        url: The Cloudinary image URL
        options: Comma-separated transformation options (default: f_auto,q_auto)
    
    Returns:
        Optimized URL with transformations applied, or original URL if not a Cloudinary URL
    """
    if not url:
        return url
    
    if not CLOUDINARY_UPLOAD_PATTERN.search(url):
        return url
    
    # Parse the URL
    parsed = urlparse(url)
    
    # Find the /image/upload/ part and insert transformations after it
    path = parsed.path
    upload_index = path.find("/image/upload/")
    if upload_index == -1:
        return url
    
    insert_pos = upload_index + len("/image/upload/")
    
    # Check if transformations already exist (they start with a letter followed by comma/underscore or end)
    existing_transforms = ""
    remaining_path = path[insert_pos:]
    
    # Cloudinary transformations are like: c_fill,w_800,h_600/
    # They end with a /
    transform_match = re.match(r"^([a-z_][a-z0-9_,]*\/)", remaining_path)
    if transform_match:
        existing_transforms = transform_match.group(1)
        insert_pos += len(existing_transforms)
    
    # Build new path with transformations
    new_path = path[:insert_pos] + options + "/" + path[insert_pos:]
    
    # Reconstruct URL
    new_parsed = parsed._replace(path=new_path)
    return urlunparse(new_parsed)


@register.filter
def cloudinary_auto(url: str) -> str:
    """
    Shortcut for common auto-optimization: f_auto,q_auto
    """
    return optimize_cloudinary_url(url, "f_auto,q_auto")


@register.filter
def cloudinary_webp(url: str) -> str:
    """
    Force WebP format: f_webp,q_auto
    """
    return optimize_cloudinary_url(url, "f_webp,q_auto")


@register.filter
def cloudinary_avif(url: str) -> str:
    """
    Force AVIF format: f_avif,q_auto
    """
    return optimize_cloudinary_url(url, "f_avif,q_auto")