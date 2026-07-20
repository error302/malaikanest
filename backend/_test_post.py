import os, sys, django, json, traceback
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, '/code')
django.setup()
from django.test import RequestFactory
from apps.products.admin_serializers import AdminProductSerializer

CAT_ID = '00742330-697c-470c-be53-d9a4f926022e'

# 1) NO VARIANT
print('\n=== TEST 1: no variant ===')
data = {
    'name': 'NoVar Test',
    'slug': 'no-var-test-001-uniq',
    'description': '',
    'price': '1500',
    'compare_price': '', 'discount_price': '',
    'stock': '10',
    'category': CAT_ID,
    'sku': '', 'gender': 'unisex',
    'age_group': '', 'age_range': '', 'size_label': '',
    'featured': 'false', 'status': 'published', 'is_active': 'true',
}
rf = RequestFactory().post('/foo/')
rf.POST = {k:v for k,v in data.items()}  # mutable list
s = AdminProductSerializer(data=data, context={'request': rf})
print('is_valid:', s.is_valid())
if s.errors:
    print('errors:', s.errors)
else:
    try:
        obj = s.save()
        print('SAVED id=', obj.id)
    except Exception as e:
        traceback.print_exc()

# 2) WITH VARIANT
print('\n=== TEST 2: with variant ===')
data['name'] = 'With Var Test A'
data['slug'] = 'with-var-test-a-uniq'
data['variants'] = '[{"color":"blue","size":"0-3m","sku":"","price_modifier":"0","stock":3,"is_active":True}]'
rf2 = RequestFactory().post('/foo/')
s2 = AdminProductSerializer(data=data, context={'request': rf2})
print('is_valid:', s2.is_valid())
if s2.errors:
    print('errors:', s2.errors)
else:
    try:
        obj = s2.save()
        print('SAVED id=', obj.id)
    except Exception as e:
        traceback.print_exc()
