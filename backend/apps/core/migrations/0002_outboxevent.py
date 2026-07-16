from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        # Transactional Outbox: durable domain events for reliable async side effects.
        migrations.CreateModel(
            name="OutboxEvent",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("aggregate_type", models.CharField(max_length=40)),
                ("aggregate_id", models.CharField(db_index=True, max_length=64)),
                ("event_type", models.CharField(max_length=60)),
                ("payload", models.JSONField(blank=True, default=dict)),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("published", "Published"), ("failed", "Failed")],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("published_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [models.Index(fields=["status", "created_at"], name="core_outbox_status_created_idx")],
            },
        ),
    ]
