"""
Input Sanitization Utilities
Provides functions to sanitize user input and prevent XSS attacks
"""
import re
from html import escape
from django.utils.html import strip_tags


def sanitize_html(value):
    """
    Sanitize HTML content by removing dangerous tags and attributes.
    Uses Django's strip_tags as a basic solution.
    """
    if not value:
        return ''
    
    # First escape HTML entities
    escaped = escape(str(value))
    
    # Then strip any remaining HTML tags
    stripped = strip_tags(escaped)
    
    return stripped


def sanitize_string(value, max_length=None, allow_special_chars=True):
    """
    Sanitize a string input.
    
    Args:
        value: The input value to sanitize
        max_length: Optional maximum length
        allow_special_chars: Whether to allow special characters
    
    Returns:
        str: Sanitized string
    """
    if not value:
        return ''
    
    value = str(value).strip()
    
    if max_length:
        value = value[:max_length]
    
    if not allow_special_chars:
        # Remove potentially dangerous characters
        value = re.sub(r'[<>\'\"%;()&+]', '', value)
    
    return value


def sanitize_email(email):
    """
    Sanitize and validate an email address.
    """
    if not email:
        return ''
    
    # Basic email validation and sanitization
    email = str(email).strip().lower()
    email = re.sub(r'[<>\'\"%;()&+]', '', email)
    
    return email


def sanitize_phone(phone):
    """
    Sanitize a phone number - only allow digits, spaces, and common separators.
    """
    if not phone:
        return ''
    
    # Only allow digits, spaces, dashes, parentheses, and plus sign
    phone = re.sub(r'[^\d\s\-\(\)\+]', '', str(phone))
    
    return phone.strip()


def sanitize_url(url):
    """
    Sanitize a URL - only allow http and https protocols.
    """
    if not url:
        return ''
    
    url = str(url).strip()
    
    # Only allow http and https
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    # Remove potentially dangerous characters
    url = re.sub(r'[<>\'\"%;()&+]', '', url)
    
    return url


def sanitize_filename(filename):
    """
    Sanitize a filename - remove dangerous characters and path traversal.
    """
    if not filename:
        return ''
    
    # Get just the filename, not any path
    filename = filename.split('/')[-1].split('\\')[-1]
    
    # Remove dangerous characters
    filename = re.sub(r'[^\w\s\-\.]', '', filename)
    
    # Limit length
    filename = filename[:255]
    
    return filename


def sanitize_search_query(query):
    """
    Sanitize a search query - remove SQL injection patterns.
    """
    if not query:
        return ''
    
    query = str(query).strip()
    
    # Remove common SQL injection patterns
    dangerous_patterns = [
        r'union\s+select',
        r'drop\s+table',
        r'drop\s+database',
        r'insert\s+into',
        r'delete\s+from',
        r'update\s+\w+\s+set',
        r'exec\s*\(',
        r'execute\s*\(',
        r'script',
    ]
    
    for pattern in dangerous_patterns:
        query = re.sub(pattern, '', query, flags=re.IGNORECASE)
    
    # Limit length
    query = query[:500]
    
    return query


class SanitizedCharField:
    """
    A descriptor class for sanitized character field input.
    Use this in forms or serializers to automatically sanitize input.
    """
    
    def __init__(self, field_name, sanitizer_func=sanitize_string, **kwargs):
        self.field_name = field_name
        self.sanitizer_func = sanitizer_func
        self.kwargs = kwargs
    
    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.field_name, '')
    
    def __set__(self, instance, value):
        instance.__dict__[self.field_name] = self.sanitizer_func(value, **self.kwargs)
