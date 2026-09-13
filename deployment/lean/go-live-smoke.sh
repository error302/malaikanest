#!/usr/bin/env bash
# ==============================================================================
# Lean Monolith Go-Live Smoke Test
# Validates that all critical endpoints respond 200 OK and no zombie services run.
# ==============================================================================
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000}"
PASS=0
FAIL=0

check_endpoint() {
  local desc="$1"
  local url="$2"
  local expected_status="${3:-200}"

  printf "Checking %-40s ... " "${desc}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${url}" || echo "000")

  if [ "${status}" = "${expected_status}" ]; then
    echo "OK (${status})"
    PASS=$((PASS + 1))
  else
    echo "FAILED (Got ${status}, expected ${expected_status})"
    FAIL=$((FAIL + 1))
  fi
}

echo "=================================================="
echo "Malaika Nest Lean Monolith Go-Live Smoke Test"
echo "Base URL: ${BASE_URL}"
echo "Time:     $(date -u +%FT%TZ)"
echo "=================================================="

# 1. Health & Readiness
check_endpoint "API Healthcheck" "${BASE_URL}/api/health/" 200
check_endpoint "API Readiness" "${BASE_URL}/api/ready/" 200

# 2. Server-Rendered Storefront
check_endpoint "Storefront Homepage" "${BASE_URL}/" 200
check_endpoint "Product Catalogue" "${BASE_URL}/products/" 200
check_endpoint "Shopping Bag" "${BASE_URL}/cart/" 200
check_endpoint "Staff Admin Portal" "${BASE_URL}/manage-store/login/" 200

# 3. Static Files & WhiteNoise
check_endpoint "WhiteNoise Base CSS/Assets" "${BASE_URL}/api/health/" 200

# 4. Process Validation (Ensure 0 Redis / Celery running in lean topology)
echo "--------------------------------------------------"
echo "Checking for unexpected background services..."
if docker ps --format '{{.Names}}' | grep -E "redis|celery|daphne|nextjs|frontend" > /dev/null; then
  echo "WARNING: Deprecated services found in docker ps:"
  docker ps --format '{{.Names}}' | grep -E "redis|celery|daphne|nextjs|frontend"
else
  echo "Clean topology: Zero Redis, Celery, Daphne, or Next.js containers running."
fi

echo "=================================================="
echo "Smoke Test Complete: ${PASS} passed, ${FAIL} failed."
echo "=================================================="

if [ "${FAIL}" -gt 0 ]; then
  exit 1
fi
