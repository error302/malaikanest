"""Restore the favicon-source-original from the actual big source."""
from PIL import Image
img = Image.open(r'C:\Users\user\Desktop\malaikanest\frontend\public\favicon-source-original.png')
print(f'Size: {img.size}')
