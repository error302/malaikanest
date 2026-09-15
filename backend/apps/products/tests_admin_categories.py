from django.contrib import admin
from django.test import RequestFactory, TestCase

from .admin import ProductAdmin
from .models import Category, Product


class CategoryLabelTests(TestCase):
    def setUp(self):
        baby = Category.objects.create(name='Baby')
        toddler = Category.objects.create(name='Toddler')
        self.baby_dress = Category.objects.create(name='Dresses', parent=baby)
        self.toddler_dress = Category.objects.create(name='Dresses', parent=toddler)
        self.model_admin = ProductAdmin(Product, admin.site)
        self.request = RequestFactory().get('/manage-store/products/product/')

    def test_product_form_distinguishes_category_paths(self):
        field = self.model_admin.formfield_for_foreignkey(Product._meta.get_field('category'), self.request)
        choices = {str(key): label for key, label in field.choices}
        self.assertEqual(choices[str(self.baby_dress.pk)], 'Baby › Dresses')
        self.assertEqual(choices[str(self.toddler_dress.pk)], 'Toddler › Dresses')

    def test_filter_labels_preserve_the_selected_category_id(self):
        from django.contrib.admin.filters import FieldListFilter
        field = Product._meta.get_field('category')
        entry = next(item for item in self.model_admin.list_filter if item == 'category' or isinstance(item, tuple) and item[0] == 'category')
        filter_class = entry[1] if isinstance(entry, tuple) else FieldListFilter.create
        params = {'category__id__exact': [str(self.baby_dress.pk)]}
        spec = filter_class(field, self.request, params, Product, self.model_admin, 'category')
        self.assertIn((self.baby_dress.pk, 'Baby › Dresses'), spec.lookup_choices)
        p1 = Product.objects.create(name='Baby dress', category=self.baby_dress, price=100)
        Product.objects.create(name='Toddler dress', category=self.toddler_dress, price=100)
        self.assertEqual(list(spec.queryset(self.request, Product.objects.all())), [p1])
