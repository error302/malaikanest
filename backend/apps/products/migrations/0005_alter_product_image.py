# Generated manually to support full Cloudinary delivery URLs.

from django.db import migrations, models

import apps.products.models


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0004_alter_banner_button_link"),
    ]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="image",
            field=models.ImageField(
                blank=True,
                max_length=500,
                null=True,
                upload_to="products/",
                validators=[apps.products.models.validate_image_file],
            ),
        ),
    ]
