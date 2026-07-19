import requests

BASE = 'https://malaikanest.com'
EMAIL = 'codex.verify.20260327.1033@example.com'
PASSWORD = 'MalaikaTest!2026'
CHECKOUT_REQUEST_ID = 'ws_CO_27032026175616832712345678'

session = requests.Session()
login = session.post(f'{BASE}/api/v1/accounts/token/', json={'email': EMAIL, 'password': PASSWORD}, timeout=30)
login.raise_for_status()
access = login.json().get('access') or login.json().get('data', {}).get('access')
verify = session.get(
    f'{BASE}/api/v1/payments/verify/{CHECKOUT_REQUEST_ID}/',
    headers={'Authorization': f'Bearer {access}'},
    timeout=30,
)
print('VERIFY_STATUS', verify.status_code)
print(verify.text)
