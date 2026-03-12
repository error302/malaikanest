# Generated manually for Cloudinary URL support

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0010_alter_banner_image_alter_category_image_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="banner",
            name="image_url",
            field=models.URLField(
                blank=True,
                help_text="Paste Cloudinary URL here instead of uploading",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="banner",
            name="mobile_image_url",
            field=models.URLField(
                blank=True, help_text="Paste Cloudinary URL for mobile", null=True
            ),
        ),
    ]
