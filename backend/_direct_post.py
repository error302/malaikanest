import os, json, uuid, http.client, urllib.request, ssl

TOKEN = open('/tmp/tok').read().strip() if os.path.exists('/tmp/tok') else os.environ.get('TOK','')
CAT_ID = '00742330-697c-470c-be53-d9a4f926022e'

# Build multipart body
boundary = '----bnd-' + uuid.uuid4().hex
def add(name, val):
    return f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{val}\r\n"

parts = []
parts.append(add('name', 'DirectTest ' + uuid.uuid4().hex[:6]))
parts.append(add('slug', 'direct-' + uuid.uuid4().hex[:8]))
parts.append(add('description', ''))
parts.append(add('price', '1500'))
parts.append(add('compare_price', ''))
parts.append(add('discount_price', ''))
parts.append(add('stock', '10'))
parts.append(add('category', CAT_ID))
parts.append(add('sku', ''))
parts.append(add('gender', 'unisex'))
parts.append(add('age_group', ''))
parts.append(add('age_range', ''))
parts.append(add('size_label', ''))
parts.append(add('featured', 'false'))
parts.append(add('status', 'published'))
parts.append(add('is_active', 'true'))
parts.append(add('variants', '[{"color":"red","size":"0-3m","sku":"sku1","price_modifier":"0.00","stock":10,"is_active":true}]'))
body = ''.join(parts) + f'--{boundary}--\r\n'

req = urllib.request.Request(
    'https://localhost:8000/api/v1/products/admin/products/',
    data=body.encode(),
    method='POST',
    headers={
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': f'multipart/form-data; boundary={boundary}',
    },
)
ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
try:
    resp = urllib.request.urlopen(req, timeout=30, context=ctx)
    print('STATUS', resp.status)
    print(resp.read().decode())
except urllib.error.HTTPError as e:
    print('HTTP', e.code)
    print(e.read().decode())
except Exception as e:
    print('ERR', e)
