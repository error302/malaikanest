from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('products', '0007_product_condition')]
    operations = [migrations.AddField(
        model_name='product', name='size_guide',
        field=models.TextField(blank=True, help_text='Actual measurements for this item, by size, in cm. State whether these are body measurements or garment measurements (e.g. chest circumference, length, waist). Leave blank until verified; do not use a different brand’s chart.'),
    )]
