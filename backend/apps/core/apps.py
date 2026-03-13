from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'
    verbose_name = 'Core'

    def ready(self):
        # Ensure Cloudinary URLs do not include a synthetic /v1/ segment.
        # When Cloudinary resources are uploaded later, /v1/ can 404 while
        # the versionless URL remains valid. Disabling force_version keeps URLs stable.
        try:
            # Importing cloudinary_storage triggers its own cloudinary.config(...) call
            # that can reset force_version back to the default (True). We import it
            # first (best-effort) and then override force_version.
            try:
                import cloudinary_storage.app_settings  # type: ignore  # noqa: F401
            except Exception:
                pass

            import cloudinary  # type: ignore
            cloudinary.config(force_version=False)
        except Exception:
            # Cloudinary is optional in dev, but mandatory in prod. If it's missing
            # here, prod will fail earlier in settings guards.
            return
