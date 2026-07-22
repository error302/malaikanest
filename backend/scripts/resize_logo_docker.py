"""Resize and convert oversized logo to optimized formats (Container version)."""
from PIL import Image
import os

src = '/tmp/logo-source.png'
out_dir = '/tmp'

img = Image.open(src)
print(f'Original: {img.size} mode={img.mode} size={os.path.getsize(src)} bytes')

target = 512
img.thumbnail((target, target), Image.LANCZOS)

tmp_png = os.path.join(out_dir, 'logo-resized-tmp.png')
img.save(tmp_png, optimize=True, compress_level=9)
print(f'Resized PNG: {os.path.getsize(tmp_png)} bytes')

tmp_webp = os.path.join(out_dir, 'logo-512.webp')
img.save(tmp_webp, 'WEBP', quality=85, method=6)
print(f'WebP: {os.path.getsize(tmp_webp)} bytes')

try:
    tmp_avif = os.path.join(out_dir, 'logo-512.avif')
    img.save(tmp_avif, 'AVIF', quality=65)
    print(f'AVIF: {os.path.getsize(tmp_avif)} bytes')
except Exception as e:
    print(f'AVIF failed: {e}')

# Also create favicon-size versions
img32 = Image.open(src)
img32.thumbnail((32, 32), Image.LANCZOS)
img32.save('/tmp/favicon-source-32.png', optimize=True, compress_level=9)
print(f'32px PNG: {os.path.getsize("/tmp/favicon-source-32.png")} bytes')
