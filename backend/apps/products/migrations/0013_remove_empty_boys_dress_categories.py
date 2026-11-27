from django.db import migrations


def remove_empty_boys_dress_categories(apps, schema_editor):
    Category = apps.get_model("products", "Category")
    categories = Category.objects.using(schema_editor.connection.alias)
    categories.filter(
        slug="dresses",
        parent__slug="boys",
        parent__parent__slug__in=("baby", "toddler", "kids"),
        parent__parent__parent__slug="clothing",
        parent__parent__parent__parent__isnull=True,
        children__isnull=True,
        products__isnull=True,
    ).delete()


class Migration(migrations.Migration):
    dependencies = [("products", "0012_assign_verified_shawl_photo")]

    operations = [
        migrations.RunPython(remove_empty_boys_dress_categories, migrations.RunPython.noop),
    ]
