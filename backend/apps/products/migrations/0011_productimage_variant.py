import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("products", "0010_align_storefront_age_ranges")]

    operations = [
        migrations.AddField(
            model_name="productimage",
            name="variant",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="gallery_images", to="products.productvariant",
            ),
        ),
    ]
