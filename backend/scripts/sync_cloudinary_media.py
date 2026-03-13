"""
One-time (or periodic) migration helper to upload existing local MEDIA_ROOT files
to Cloudinary using the same public IDs expected by django-cloudinary-storage.

Why this exists:
- The project historically stored uploads on disk at /var/www/backend/media.
- Production now uses MediaCloudinaryStorage, which generates URLs like:
    https://res.cloudinary.com/<cloud>/image/upload/v1/media/products/foo.jpg
- If the file was never uploaded to Cloudinary, those URLs 404 and Next.js image
  optimization (/_next/image) will also 404.

This script uploads local files to Cloudinary under public_id "media/<relpath without ext>".
It is safe to run multiple times; by default it is a dry-run.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import cloudinary
import cloudinary.uploader


DEFAULT_ALLOWED_DIRS = ("products", "categories", "banners", "brands")
DEFAULT_ALLOWED_EXTS = (".jpg", ".jpeg", ".png", ".webp")


def iter_media_files(media_root: Path, allowed_dirs: tuple[str, ...], allowed_exts: tuple[str, ...]):
    for rel_dir in allowed_dirs:
        base = media_root / rel_dir
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix.lower() not in allowed_exts:
                continue
            yield path


def public_id_for_local_path(media_root: Path, local_path: Path) -> str:
    rel = local_path.relative_to(media_root).as_posix()  # e.g. products/foo.jpg
    rel_no_ext = rel.rsplit(".", 1)[0]  # products/foo
    return f"media/{rel_no_ext}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--media-root", default=os.getenv("MEDIA_ROOT") or "media")
    parser.add_argument("--apply", action="store_true", help="Perform uploads (default: dry-run)")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of files processed (0 = no limit)")
    parser.add_argument("--dirs", default=",".join(DEFAULT_ALLOWED_DIRS))
    args = parser.parse_args()

    media_root = Path(args.media_root).resolve()
    allowed_dirs = tuple([d.strip() for d in args.dirs.split(",") if d.strip()])

    cloudinary_url = os.getenv("CLOUDINARY_URL", "").strip()
    if not cloudinary_url:
        raise SystemExit("CLOUDINARY_URL is not set; cannot upload.")

    print(f"MEDIA_ROOT={media_root}")
    print(f"dirs={allowed_dirs}")
    print("mode=" + ("APPLY" if args.apply else "DRY_RUN"))

    count = 0
    uploaded = 0
    skipped = 0

    for path in iter_media_files(media_root, allowed_dirs, DEFAULT_ALLOWED_EXTS):
        public_id = public_id_for_local_path(media_root, path)
        count += 1

        if args.limit and count > args.limit:
            break

        print(f"[{count:04d}] {path} -> {public_id}")

        if not args.apply:
            skipped += 1
            continue

        # Upload with deterministic public_id. If it already exists, keep it.
        # We do not delete local files; Nginx can still serve /media as a fallback.
        cloudinary.uploader.upload(
            str(path),
            public_id=public_id,
            overwrite=False,
            unique_filename=False,
            resource_type="image",
            invalidate=False,
        )
        uploaded += 1

    print(f"Done. files_seen={count} uploaded={uploaded} dryrun_skipped={skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

