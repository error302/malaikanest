import requests

BASE = 'https://malaikanest.com'
EMAIL = 'codex.verify.20260327.1033@example.com'
PASSWORD = 'MalaikaTest!2026'
ORDER_ID = 12
PHONE = '254712345678'

session = requests.Session()
session.headers.update({'Accept': 'application/json'})

login = session.post(
    f'{BASE}/api/v1/accounts/token/',
    json={'email': EMAIL, 'password': PASSWORD},
    timeout=30,
)
print('LOGIN_STATUS', login.status_code)
print(login.text)
login.raise_for_status()
login_json = login.json()
access = login_json.get('access') or login_json.get('data', {}).get('access')
if not access:
    raise SystemExit('No access token returned')

headers = {
    'Authorization': f'Bearer {access}',
    'Content-Type': 'application/json',
}

initiate = session.post(
    f'{BASE}/api/v1/payments/mpesa/initiate/',
    headers=headers,
    json={'order_id': ORDER_ID, 'phone': PHONE},
    timeout=60,
)
print('INITIATE_STATUS', initiate.status_code)
print(initiate.text)

if initiate.ok:
    data = initiate.json()
    checkout_request_id = data.get('checkout_request_id') or data.get('data', {}).get('checkout_request_id')
    if checkout_request_id:
        verify = session.get(
            f'{BASE}/api/v1/payments/verify/{checkout_request_id}/',
            headers={'Authorization': f'Bearer {access}'},
            timeout=30,
        )
        print('VERIFY_STATUS', verify.status_code)
        print(verify.text)
