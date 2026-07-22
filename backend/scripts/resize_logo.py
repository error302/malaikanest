"""Resize and convert oversized logo to optimized formats."""
from PIL import Image
import os

src = r'C:\Users\user\Desktop\malaikanest\frontend\public\logo.png'

img = Image.open(src)
print(f'Original: {img.size} mode={img.mode} size={os.path.getsize(src)} bytes')

# Logo is used at 67x44 in header. Also appears at 38x38 (favicon-source).
# We need:
# - 256x256 master (for srcset if needed)
# - Replace the giant 2.2MB PNG with a properly-sized optimized PNG
# The image is over 393k x 262k - that's probably a 2x scaling error.
# Resize to a square 512x512 first.

# Simple fix: downsize dramatically
target = 512
img.thumbnail((target, target), Image.LANCZOS)

out_dir = r'C:\Users\user\Desktop\malaikanest\frontend\public'
# Reoptimized PNG at the actual displayed max
tmp_png = os.path.join(out_dir, 'logo-resized-tmp.png')
img.save(tmp_png, optimize=True, compress_level=9)
print(f'Resized PNG: {os.path.getsize(tmp_png)} bytes (target {target}px)')

# WebP version (much better compression)
tmp_webp = os.path.join(out_dir, 'logo-512.webp')
img.save(tmp_webp, 'WEBP', quality=85, method=6)
print(f'WebP: {os.path.getsize(tmp_webp)} bytes')

# AVIF version (best compression)
try:
    tmp_avif = os.path.join(out_dir, 'logo-512.avif')
    img.save(tmp_avif, 'AVIF', quality=65)
    print(f'AVIF: {os.path.getsize(tmp_avif)} bytes')
except Exception as e:
    print(f'AVIF failed: {e}')
