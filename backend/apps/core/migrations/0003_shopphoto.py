from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_outboxevent"),
    ]

    operations = [
        migrations.CreateModel(
            name="ShopPhoto",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("image", models.ImageField(upload_to="shop_photos/")),
                ("image_url", models.URLField(blank=True, null=True, help_text="Paste Cloudinary URL instead of uploading")),
                ("caption", models.CharField(blank=True, max_length=200)),
                ("is_active", models.BooleanField(default=True)),
                ("position", models.PositiveSmallIntegerField(default=0)),
            ],
            options={
                "verbose_name": "Shop Photo",
                "verbose_name_plural": "Shop Photos",
                "ordering": ["position", "-created_at"],
            },
        ),
    ]
