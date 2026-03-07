#!/bin/bash
set -euo pipefail

# Validate security posture on deployed domain.
DOMAIN="${DOMAIN:-malaikanest.duckdns.org}"
BASE="https://${DOMAIN}"

check_header() {
  local path="$1"
  local header="$2"
  if ! curl -sI "$BASE$path" | grep -iq "$header"; then
    echo "[FAIL] Missing header '$header' on $path"
    return 1
  fi
  echo "[OK] $header on $path"
}

echo "Checking HTTPS redirect..."
if curl -sI "http://${DOMAIN}" | grep -iq "location: https://"; then
  echo "[OK] HTTP redirects to HTTPS"
else
  echo "[FAIL] HTTP does not redirect to HTTPS"
fi

check_header "/" "strict-transport-security"
check_header "/" "x-frame-options"
check_header "/" "x-content-type-options"
check_header "/" "content-security-policy"
check_header "/" "referrer-policy"

echo "Checking login rate limiting (expect 429 eventually)..."
for i in $(seq 1 15); do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/accounts/token/" -H "Content-Type: application/json" -d '{"email":"invalid@example.com","password":"badpass"}')
  if [ "$code" = "429" ]; then
    echo "[OK] Rate limiting triggered"
    exit 0
  fi
  sleep 1
done

echo "[WARN] Rate limiting did not trigger in sample window"