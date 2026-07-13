"""Read-replica database router.

Routes read queries to the "replica" database (when configured) and all writes
and migrations to "default". Inside an atomic block Django binds the whole
transaction to a single DB, so a write started on "default" keeps subsequent
reads in that block on "default" — only reads outside transactions hit the
replica, which is the expected (eventually-consistent) behaviour for a replica.
"""


class ReplicaRouter:
    def db_for_read(self, model, **hints):
        from django.conf import settings

        return "replica" if "replica" in settings.DATABASES else "default"

    def db_for_write(self, model, **hints):
        return "default"

    def allow_relation(self, obj1, obj2, **hints):
        # Allow relations only within the same database.
        return obj1._state.db in (None, "default", "replica") and obj2._state.db in (
            None,
            "default",
            "replica",
        )

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # Never run migrations against the read replica.
        return db == "default"
