import requests

payload = {
    'email': 'test_parent_2026@malaikanest.com',
    'password': 'TestPass123',
    'first_name': 'Parent',
    'last_name': 'Test',
    'phone_number': '0712345888'
}
headers = {
    'Host': 'api.malaikanest.com',
    'X-Forwarded-Proto': 'https'
}

r = requests.post('http://127.0.0.1:8081/api/v1/accounts/register/', json=payload, headers=headers)
print("STATUS CODE:", r.status_code)
print("RESPONSE JSON:", r.text)
