data = '[{"color":"red","size":"0-3m","sku":"sku1","price_modifier":"0.00","stock":10,"is_active":true}]'
import json
try:
    print(json.loads(data))
except Exception as e:
    print('fail', type(e).__name__, e)

# Now check if there are weird unicode escape or whitespace
print('len', len(data))
print(repr(data[:60]))
