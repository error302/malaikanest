#!/usr/bin/env bash
# deploy-to-vm.sh — Automated production deployment for Malaika Nest
# Run from your local machine (where ~/.ssh/MalaikaNestKey exists)
# Usage: ./deploy-to-vm.sh [--create-superuser]

set -euo pipefail

# Configuration
VM_USER="mohameddosho20"
VM_IP="104.154.161.10"
VM_DIR="/var/www/malaikanest"
SSH_KEY="$HOME/.ssh/MalaikaNestKey"
CREATE_SUPERUSER="${1:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[deploy]${NC} $*"; }
success() { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

# Pre-flight checks
[[ -f "$SSH_KEY" ]] || error "SSH key not found: $SSH_KEY"
command -v ssh >/dev/null || error "ssh not installed"
command -v rsync >/dev/null || warn "rsync not installed (sync skipped)"

log "Connecting to $VM_USER@$VM_IP..."

# Build remote command
REMOTE_CMD="
set -euo pipefail
cd $VM_DIR

echo '=== Adding ADMIN_AUTHORIZED_EMAILS to .env ===' 
grep -q '^ADMIN_AUTHORIZED_EMAILS=' .env 2>/dev/null || echo 'ADMIN_AUTHORIZED_EMAILS=admin@malaikanest.com,owner@malaikanest.com' >> .env
echo 'ADMIN_AUTHORIZED_EMAILS set'

echo '=== Pulling latest images ===' 
docker compose pull

echo '=== Restarting services ===' 
docker compose up -d

echo '=== Waiting for backend to be healthy ===' 
sleep 5
for i in {1..12}; do
  if docker compose exec -T backend python manage.py check --deploy 2>/dev/null | grep -q 'System check identified no issues'; then
    echo 'Backend healthy'
    break
  fi
  sleep 5
done

echo '=== Running migrations (TOTP tables) ===' 
docker compose exec -T backend python manage.py migrate

if [[ \"$CREATE_SUPERUSER\" == \"--create-superuser\" ]]; then
  echo '=== Creating superuser ===' 
  docker compose exec -T backend python manage.py createsuperuser --email admin@malaikanest.com --username admin --noinput || true
fi

echo '=== Verification ===' 
docker compose ps
echo '--- Backend logs (last 30 lines) ---'
docker compose logs backend --tail=30
"

# Execute
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "$VM_USER@$VM_IP" "$REMOTE_CMD"

success "Deployment complete!"
echo
echo "Next steps:"
echo "  1. Visit https://malaikanest.com/manage-store/"
echo "  2. Log in → Two Factor Authentication → TOTP Device → Add device for each admin"
echo "  3. Scan QR code with authenticator app"
echo "  4. Place test order → verify email templates render correctly"