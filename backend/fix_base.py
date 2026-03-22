import re

filepath = r"c:\Users\ADMIN\Desktop\PROJECT BABY\malaika nest\backend\config\settings\base.py"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """def get_env_or_crash(var_name):
    import os
    from django.core.exceptions import ImproperlyConfigured
    val = os.getenv(var_name)
    if not val:
        raise ImproperlyConfigured(f"{var_name} environment variable is strictly required by the Behavioral Contract.")
    return val

SECRET_KEY = get_env_or_crash("SECRET_KEY")"""

# Replace the SECRET_KEY logic
content = re.sub(r'_SECRET_KEY = os\.getenv\("SECRET_KEY"\).*?SECRET_KEY = _SECRET_KEY', replacement, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated base.py configuration.")
