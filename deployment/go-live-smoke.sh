#!/bin/bash
set -euo pipefail

# Malaika Nest production go-live smoke test
# Usage:
# BASE_URL=https://malaikanest.duckdns.org \
# ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='***' \
# TEST_EMAIL=smoke+$(date +%s)@example.com TEST_PASSWORD='TestPass123!' \
# ADMIN_WRITE_TEST=1 \
# bash deployment/go-live-smoke.sh

BASE_URL="${BASE_URL:-https://malaikanest.duckdns.org}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
TEST_EMAIL="${TEST_EMAIL:-smoke.$(date +%s)@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-TestPass123!}"
ADMIN_WRITE_TEST="${ADMIN_WRITE_TEST:-0}"
COOKIE_JAR="${COOKIE_JAR:-/tmp/malaika_smoke_cookies.txt}"

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  echo "[PASS] $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "[FAIL] $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

http_code() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

echo "== Smoke test target: $BASE_URL =="

# 1) HTTPS + headers
code=$(http_code -I "$BASE_URL")
[[ "$code" == "200" || "$code" == "301" || "$code" == "302" ]] && pass "Site responds over HTTPS ($code)" || fail "Site HTTPS failed ($code)"

for header in "strict-transport-security" "x-frame-options" "x-content-type-options" "content-security-policy" "referrer-policy"; do
  if curl -sI "$BASE_URL" | tr '[:upper:]' '[:lower:]' | grep -q "$header"; then
    pass "Header present: $header"
  else
    fail "Missing header: $header"
  fi
done

# 2) Public API health
for path in "/api/health/" "/api/products/products/" "/api/products/categories/" "/api/products/banners/"; do
  code=$(http_code "$BASE_URL$path")
  [[ "$code" == "200" ]] && pass "GET $path -> 200" || fail "GET $path -> $code"
done

# 3) User registration
reg_code=$(curl -s -o /tmp/malaika_reg.json -w "%{http_code}" -X POST "$BASE_URL/api/accounts/register/" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Smoke\",\"last_name\":\"Test\",\"phone\":\"254700000000\"}")
if [[ "$reg_code" == "201" || "$reg_code" == "400" ]]; then
  pass "Register endpoint reachable ($reg_code)"
else
  fail "Register failed ($reg_code)"
fi

# 4) Customer login + cart flow
user_login_code=$(curl -s -o /tmp/malaika_user_login.json -w "%{http_code}" -c /tmp/malaika_user_cookies.txt -X POST "$BASE_URL/api/accounts/token/" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if [[ "$user_login_code" == "200" ]]; then
  pass "Customer login successful"

  PRODUCT_ID=$(curl -s "$BASE_URL/api/products/products/" | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data[0]["id"] if isinstance(data,list) and data else "")' 2>/dev/null || true)
  if [[ -n "${PRODUCT_ID:-}" ]]; then
    add_cart_code=$(curl -s -o /tmp/malaika_cart_add.json -w "%{http_code}" -b /tmp/malaika_user_cookies.txt -X POST "$BASE_URL/api/orders/cart/add/" \
      -H "Content-Type: application/json" \
      -d "{\"product_id\":$PRODUCT_ID,\"quantity\":1}")
    [[ "$add_cart_code" == "200" || "$add_cart_code" == "201" ]] && pass "Cart add works" || fail "Cart add failed ($add_cart_code)"

    cart_list_code=$(curl -s -o /tmp/malaika_cart_list.json -w "%{http_code}" -b /tmp/malaika_user_cookies.txt "$BASE_URL/api/orders/cart/")
    [[ "$cart_list_code" == "200" ]] && pass "Cart list works" || fail "Cart list failed ($cart_list_code)"

    update_cart_code=$(curl -s -o /tmp/malaika_cart_update.json -w "%{http_code}" -b /tmp/malaika_user_cookies.txt -X POST "$BASE_URL/api/orders/cart/update/" \
      -H "Content-Type: application/json" \
      -d "{\"product_id\":$PRODUCT_ID,\"quantity\":2}")
    [[ "$update_cart_code" == "200" ]] && pass "Cart update works" || fail "Cart update failed ($update_cart_code)"

    checkout_code=$(curl -s -o /tmp/malaika_cart_checkout.json -w "%{http_code}" -b /tmp/malaika_user_cookies.txt -X POST "$BASE_URL/api/orders/cart/checkout/" \
      -H "Content-Type: application/json" \
      -d '{"delivery_region":"nairobi"}')
    [[ "$checkout_code" == "200" || "$checkout_code" == "201" || "$checkout_code" == "400" ]] && pass "Checkout path reachable ($checkout_code)" || fail "Checkout path failed ($checkout_code)"
  else
    fail "No products available for cart flow validation"
  fi
else
  fail "Customer login failed ($user_login_code)"
fi

# 5) Admin login and CRUD gate (if creds provided)
if [[ -n "$ADMIN_EMAIL" && -n "$ADMIN_PASSWORD" ]]; then
  login_code=$(curl -s -o /tmp/malaika_admin_login.json -w "%{http_code}" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/accounts/admin/login/" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

  if [[ "$login_code" == "200" ]]; then
    pass "Admin login successful"

    categories_code=$(curl -s -o /tmp/malaika_admin_categories.json -w "%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/products/admin/categories/")
    [[ "$categories_code" == "200" ]] && pass "Admin categories read OK" || fail "Admin categories read failed ($categories_code)"

    products_code=$(curl -s -o /tmp/malaika_admin_products.json -w "%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/products/admin/products/")
    [[ "$products_code" == "200" ]] && pass "Admin products read OK" || fail "Admin products read failed ($products_code)"

    banners_code=$(curl -s -o /tmp/malaika_admin_banners.json -w "%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/products/admin/banners/")
    [[ "$banners_code" == "200" ]] && pass "Admin banners read OK" || fail "Admin banners read failed ($banners_code)"

    if [[ "$ADMIN_WRITE_TEST" == "1" ]]; then
      category_id=$(python3 -c 'import json; d=json.load(open("/tmp/malaika_admin_categories.json")); print(d[0]["id"] if isinstance(d,list) and d else "")' 2>/dev/null || true)
      if [[ -n "${category_id:-}" ]]; then
        ts=$(date +%s)
        slug="smoke-product-$ts"
        create_code=$(curl -s -o /tmp/malaika_admin_product_create.json -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/products/admin/products/" \
          -H "Content-Type: application/json" \
          -d "{\"name\":\"Smoke Product $ts\",\"slug\":\"$slug\",\"description\":\"smoke test product\",\"price\":\"999.00\",\"category\":$category_id,\"stock\":5,\"is_active\":true,\"gender\":\"unisex\"}")
        if [[ "$create_code" == "201" ]]; then
          pass "Admin product create OK"
          product_id=$(python3 -c 'import json; d=json.load(open("/tmp/malaika_admin_product_create.json")); print(d.get("id",""))' 2>/dev/null || true)
          if [[ -n "${product_id:-}" ]]; then
            patch_code=$(curl -s -o /tmp/malaika_admin_product_patch.json -w "%{http_code}" -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/products/admin/products/$product_id/" \
              -H "Content-Type: application/json" \
              -d '{"price":"1099.00"}')
            [[ "$patch_code" == "200" ]] && pass "Admin product update OK" || fail "Admin product update failed ($patch_code)"

            delete_code=$(curl -s -o /tmp/malaika_admin_product_delete.json -w "%{http_code}" -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/products/admin/products/$product_id/")
            [[ "$delete_code" == "204" ]] && pass "Admin product delete OK" || fail "Admin product delete failed ($delete_code)"
          else
            fail "Admin product created but ID missing in response"
          fi
        else
          fail "Admin product create failed ($create_code)"
        fi
      else
        fail "Admin write test skipped: no category ID found"
      fi
    else
      echo "[INFO] Skipping admin write CRUD test (set ADMIN_WRITE_TEST=1 to enable)"
    fi
  else
    fail "Admin login failed ($login_code)"
  fi
else
  echo "[INFO] Skipping admin login checks (ADMIN_EMAIL/ADMIN_PASSWORD not provided)"
fi

# 6) Orders endpoint reachability
orders_code=$(http_code -X POST "$BASE_URL/api/orders/orders/" -H "Content-Type: application/json" -d '{}')
if [[ "$orders_code" == "400" || "$orders_code" == "401" || "$orders_code" == "403" ]]; then
  pass "Orders endpoint reachable (got expected guarded code $orders_code)"
else
  fail "Orders endpoint unexpected response ($orders_code)"
fi

# 7) Basic rate-limit signal on auth
rate_hit=0
for i in $(seq 1 20); do
  code=$(http_code -X POST "$BASE_URL/api/accounts/token/" -H "Content-Type: application/json" -d '{"email":"invalid@example.com","password":"badpass"}')
  if [[ "$code" == "429" || "$code" == "423" ]]; then
    rate_hit=1
    break
  fi
  sleep 0.4
done

[[ "$rate_hit" -eq 1 ]] && pass "Auth protections triggered (429/423)" || fail "Auth protections not observed in sample"

echo

echo "== Smoke test summary =="
echo "PASS: $PASS_COUNT"
echo "FAIL: $FAIL_COUNT"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi

exit 0