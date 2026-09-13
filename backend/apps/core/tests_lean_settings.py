from django.test import SimpleTestCase
import os
import importlib
from unittest.mock import patch


class LeanProductionSettingsTests(SimpleTestCase):
    def test_production_caches_use_locmem_not_redis(self):
        """Production caches must use LocMemCache rather than RedisCache."""
        from config.settings import prod

        caches = prod.CACHES
        for name in ["default", "banners", "categories", "products"]:
            self.assertIn(name, caches, f"Cache '{name}' missing in prod settings")
            backend = caches[name]["BACKEND"]
            self.assertEqual(
                backend,
                "django.core.cache.backends.locmem.LocMemCache",
                f"Cache '{name}' must use LocMemCache, got {backend}",
            )

    def test_production_does_not_require_redis_channel_layer(self):
        """Production runtime must not require RedisChannelLayer or Redis host."""
        from config.settings import base, prod

        channel_layers = getattr(prod, "CHANNEL_LAYERS", getattr(base, "CHANNEL_LAYERS", {}))
        default_layer = channel_layers.get("default", {})
        backend = default_layer.get("BACKEND", "")
        self.assertNotEqual(
            backend,
            "channels_redis.core.RedisChannelLayer",
            "Production must not use channels_redis.core.RedisChannelLayer",
        )

    def test_production_does_not_use_read_replica_router(self):
        """Lean production must not configure read replica routers."""
        from config.settings import prod

        routers = getattr(prod, "DATABASE_ROUTERS", [])
        self.assertEqual(
            routers,
            [],
            "Lean production must have no database read replica routers",
        )
