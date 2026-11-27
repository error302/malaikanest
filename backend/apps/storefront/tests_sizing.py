from django.test import TestCase, override_settings
from django.urls import reverse

from apps.products.models import Category, Inventory, Product, ProductVariant, VariantInventory


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=['testserver'])
class SizeShoppingTests(TestCase):
    def setUp(self):
        category = Category.objects.create(name='Clothes')
        self.product = Product.objects.create(name='Dress', category=category, price=100, is_active=True, status='published')
        self.variant = ProductVariant.objects.create(product=self.product, size='2y', color='blue')
        VariantInventory.objects.update_or_create(variant=self.variant, defaults={'quantity': 3, 'reserved': 1})
        self.empty = ProductVariant.objects.create(product=self.product, size='3y', color='blue')
        VariantInventory.objects.update_or_create(variant=self.empty, defaults={'quantity': 2, 'reserved': 2})
        self.other = Product.objects.create(name='Romper', category=category, price=200, size_label='newborn', is_active=True, status='published')
        Inventory.objects.update_or_create(product=self.other, defaults={'quantity': 2})

    def test_size_filter_matches_only_available_size(self):
        response = self.client.get(reverse('storefront:product_list'), {'size': '2y'})
        self.assertEqual([p.pk for p in response.context['products']], [self.product.pk])
        empty = self.client.get(reverse('storefront:product_list'), {'size': '3y'})
        self.assertEqual(list(empty.context['products']), [])

    def test_product_detail_preselects_the_only_available_option(self):
        url = reverse('storefront:product_detail', args=[self.product.slug])
        response = self.client.get(url)
        self.assertEqual(response.context['default_variant'], self.variant)
        self.assertContains(response, f'value="{self.variant.pk}" required checked')
        VariantInventory.objects.filter(variant=self.empty).update(reserved=0)
        response = self.client.get(url)
        self.assertIsNone(response.context['default_variant'])

    def test_cards_show_available_sizes_not_reserved_or_inactive(self):
        self.variant.is_active = False
        self.variant.save()
        response = self.client.get(reverse('storefront:product_list'))
        by_id = {p.pk: p for p in response.context['products']}
        self.assertEqual(getattr(by_id[self.product.pk], 'shop_sizes', None), [])
        self.assertEqual(getattr(by_id[self.other.pk], 'shop_sizes', None), ['Newborn'])

    def test_all_inactive_variants_do_not_fall_back_to_parent_stock(self):
        self.product.stock = 10
        self.product.save(update_fields=['stock'])
        self.variant.is_active = False
        self.variant.save(update_fields=['is_active'])
        self.empty.is_active = False
        self.empty.save(update_fields=['is_active'])
        response = self.client.get(reverse('storefront:product_list'))
        by_id = {p.pk: p for p in response.context['products']}
        self.assertEqual(by_id[self.product.pk].shop_stock, 0)
        self.assertEqual(by_id[self.product.pk].shop_sizes, [])

    def test_size_filter_excludes_all_inactive_variants_with_parent_stock(self):
        Product.objects.filter(pk=self.product.pk).update(status='published', stock=10, size_label='2y')
        Inventory.objects.update_or_create(product=self.product, defaults={'quantity': 10, 'reserved': 0})
        self.product.variants.update(is_active=False)
        response = self.client.get(reverse('storefront:product_list'), {'size': '2y'})
        self.assertEqual(list(response.context['products']), [])

    def test_measurements_are_owner_provided_and_escaped(self):
        self.product.size_guide = '2y: chest 54 cm. <script>alert(1)</script>'
        self.product.save()
        response = self.client.get(reverse('storefront:product_detail', args=[self.product.slug]))
        self.assertContains(response, '2y: chest 54 cm.')
        self.assertNotContains(response, '<script>alert(1)</script>')
        self.assertNotContains(response, 'up to 56 cm')

    def test_pagination_preserves_filters(self):
        Product.objects.bulk_create([
            Product(name=f'Dress {idx}', slug=f'dress-{idx}', category=self.product.category, price=100 + idx, is_active=True, status='published', stock=1)
            for idx in range(18)
        ])
        response = self.client.get(reverse('storefront:product_list'), {'size':'2y', 'condition':'new', 'q':'Dress', 'sort':'price_asc', 'page':'2'})
        query = response.context.get('pagination_query', '')
        self.assertIn('size=2y', query)
        self.assertIn('condition=new', query)
        self.assertIn('q=Dress', query)
        self.assertNotIn('page=', query)
