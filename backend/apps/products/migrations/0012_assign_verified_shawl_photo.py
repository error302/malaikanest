from django.db import migrations


SLUG = "soft-plush-baby-blanket-shawl"
BROWN_PHOTO = "https://res.cloudinary.com/dnnr5zo0w/image/upload/v1773841653/baby_shawl_brown_pa0je7.jpg"
BLUE_COVER = "https://res.cloudinary.com/dnnr5zo0w/image/upload/v1774721031/media/products/variants/baby_shawl_kqyish_aqm53e.jpg"


def assign_brown_photo(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    Variant = apps.get_model("products", "ProductVariant")
    ProductImage = apps.get_model("products", "ProductImage")
    db = schema_editor.connection.alias
    product = Product.objects.using(db).filter(slug=SLUG).first()
    if not product:
        return
    brown = Variant.objects.using(db).filter(product=product, color="brown", size="newborn", is_active=True).first()
    if not brown:
        return
    assigned = ProductImage.objects.using(db).filter(
        product=product, image_url=BROWN_PHOTO, variant__isnull=True,
    ).update(variant=brown, alt_text="Packaged blanket — Brown")
    if assigned and product.image_url == BLUE_COVER:
        Product.objects.using(db).filter(pk=product.pk).update(image_url=BROWN_PHOTO)


class Migration(migrations.Migration):
    dependencies = [("products", "0011_productimage_variant")]

    operations = [migrations.RunPython(assign_brown_photo, migrations.RunPython.noop)]
