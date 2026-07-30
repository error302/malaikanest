#!/bin/bash
echo "=== TEST 1: Login with newly registered user ==="
curl -s -X POST http://127.0.0.1:8081/api/v1/accounts/token/ \
  -H 'Content-Type: application/json' \
  -H 'Host: api.malaikanest.com' \
  -H 'X-Forwarded-Proto: https' \
  -d '{"email": "test_bugfix2026@malaikanest.com", "password": "TestPass123"}'
echo ""
echo ""

echo "=== TEST 2: Login with 01-prefix user ==="
curl -s -X POST http://127.0.0.1:8081/api/v1/accounts/token/ \
  -H 'Content-Type: application/json' \
  -H 'Host: api.malaikanest.com' \
  -H 'X-Forwarded-Proto: https' \
  -d '{"email": "test_01prefix@malaikanest.com", "password": "TestPass123"}'
echo ""
