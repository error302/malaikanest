import os
import re

APPS_DIR = r"c:\Users\ADMIN\Desktop\PROJECT BABY\malaika nest\backend\apps"
MODELS_TO_FIX = ['orders', 'products', 'accounts', 'ai']  # Let's fix them all

for app in MODELS_TO_FIX:
    file_path = os.path.join(APPS_DIR, app, 'models.py')
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "from apps.core.models import BaseModel" not in content:
        # Add import at top
        if "from django.db import models, transaction" in content:
            content = content.replace("from django.db import models, transaction\n", "from django.db import models, transaction\nfrom apps.core.models import BaseModel\n")
        elif "from django.db import models" in content:
            content = content.replace("from django.db import models\n", "from django.db import models\nfrom apps.core.models import BaseModel\n")
        else:
            content = "from apps.core.models import BaseModel\n" + content
            
    # Replace (models.Model) but NOT AbstractBaseUser or others
    content = re.sub(r'class (\w+)\(models\.Model\):', r'class \1(BaseModel):', content)
    
    # Remove explicit created_at and updated_at lines
    content = re.sub(r'^\s*created_at\s*=\s*models\.DateTimeField.*?\n', '', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*updated_at\s*=\s*models\.DateTimeField.*?\n', '', content, flags=re.MULTILINE)
    
    # Specific Invoice fix
    content = content.replace("generated_at", "created_at")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Successfully refactored models to inherit from BaseModel.")
