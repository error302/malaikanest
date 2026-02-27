from django.db import migrations, models
import cloudinary.models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_category_image'),
    ]

    operations = [
        migrations.CreateModel(
            name='Banner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, max_length=200)),
                ('image', cloudinary.models.CloudinaryField(verbose_name='image')),
                ('link', models.URLField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('position', models.PositiveSmallIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['position', '-created_at'],
            },
        ),
    ]
