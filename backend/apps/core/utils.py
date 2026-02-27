import re
from django.core.exceptions import ValidationError


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
