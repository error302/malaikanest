#!/bin/bash
set -euo pipefail

# Requires gcloud auth and project context.
PROJECT_ID="${PROJECT_ID:-}"
NETWORK="${NETWORK:-default}"
SOURCE_RANGE="${SOURCE_RANGE:-}"
RULE_PREFIX="${RULE_PREFIX:-malaikanest}"

if [ -z "$PROJECT_ID" ]; then
  echo "Set PROJECT_ID"
  exit 1
fi

if [ -z "$SOURCE_RANGE" ]; then
  echo "Set SOURCE_RANGE for SSH allowlist (for example 203.0.113.10/32)"
  exit 1
fi

gcloud config set project "$PROJECT_ID"

# Allow only web traffic publicly
gcloud compute firewall-rules create "${RULE_PREFIX}-allow-web" \
  --network "$NETWORK" \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags "${RULE_PREFIX}-web" || true

# Restrict SSH by source range
gcloud compute firewall-rules create "${RULE_PREFIX}-allow-ssh" \
  --network "$NETWORK" \
  --allow tcp:22 \
  --source-ranges "$SOURCE_RANGE" \
  --target-tags "${RULE_PREFIX}-web" || true

# Explicit deny for app ports
gcloud compute firewall-rules create "${RULE_PREFIX}-deny-app" \
  --network "$NETWORK" \
  --action DENY \
  --rules tcp:3000,tcp:8000,tcp:8001 \
  --source-ranges 0.0.0.0/0 \
  --priority 900 \
  --target-tags "${RULE_PREFIX}-web" || true

echo "Firewall rules applied."