#!/bin/bash
curl -s -X POST http://127.0.0.1:8081/api/v1/accounts/register/ \
  -H 'Content-Type: application/json' \
  -H 'Host: api.malaikanest.com' \
  -H 'X-Forwarded-Proto: https' \
  -d '{"email": "test_bugfix2026@malaikanest.com", "password": "TestPass123", "first_name": "BugFix", "last_name": "Test", "phone_number": "0712999777"}'

echo ""
echo "---"
echo "Now testing login with the registered user..."
curl -s -X POST http://127.0.0.1:8081/api/v1/accounts/login/ \
  -H 'Content-Type: application/json' \
  -H 'Host: api.malaikanest.com' \
  -H 'X-Forwarded-Proto: https' \
  -d '{"email": "test_bugfix2026@malaikanest.com", "password": "TestPass123"}'

echo ""
echo "---"
echo "Testing with 01 prefix phone number..."
curl -s -X POST http://127.0.0.1:8081/api/v1/accounts/register/ \
  -H 'Content-Type: application/json' \
  -H 'Host: api.malaikanest.com' \
  -H 'X-Forwarded-Proto: https' \
  -d '{"email": "test_01prefix@malaikanest.com", "password": "TestPass123", "first_name": "Prefix", "last_name": "Test", "phone_number": "0112345678"}'
echo ""
