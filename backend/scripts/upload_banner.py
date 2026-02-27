import os
import sys
from pathlib import Path

# simple loader for .env KEY=VALUE lines
def load_env(env_path: Path):
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())


def main():
    if len(sys.argv) < 2:
        print('Usage: python upload_banner.py <path-to-image> [title]')
        return

    img_path = Path(sys.argv[1])
    title = sys.argv[2] if len(sys.argv) > 2 else img_path.stem.replace('-', ' ').title()

    if not img_path.exists() or not img_path.is_file():
        print(f'File not found: {img_path}')
        return

    # load backend .env if present
    project_root = Path(__file__).resolve().parents[1]
    load_env(project_root / '.env')

    # ensure DJANGO settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

    try:
        import django
        django.setup()
    except Exception as e:
        print('Failed to setup Django:', e)
        return

    try:
        import cloudinary.uploader
    except Exception as e:
        print('cloudinary package missing:', e)
        return

    try:
        res = cloudinary.uploader.upload(str(img_path), folder='malaika_nest_banners')
        public_id = res.get('public_id')
        url = res.get('secure_url') or res.get('url')
    except Exception as e:
        print('Cloudinary upload failed:', e)
        return

    try:
        from apps.products.models import Banner
        b = Banner.objects.create(title=title, image=public_id, is_active=True)
        print('Banner created:', b.pk)
        print('Image url:', url)
    except Exception as e:
        print('Failed to create Banner record:', e)
        # still print upload result
        print('Upload public_id:', public_id)
        print('Upload url:', url)


if __name__ == '__main__':
    main()