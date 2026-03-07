#!/bin/bash

# Malaika Nest - VM Setup Script
# Run as: sudo DOMAIN=shop.example.com EMAIL=ops@example.com SSH_ALLOW_CIDR=203.0.113.10/32 ALLOW_USER=mohameddosho20 PROJECT_ID=my-gcp-project bash setup-vm.sh

set -euo pipefail

echo "=== Malaika Nest VM Setup ==="

DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
SSH_ALLOW_CIDR="${SSH_ALLOW_CIDR:-}"
ALLOW_USER="${ALLOW_USER:-}"
PROJECT_ID="${PROJECT_ID:-}"
APP_ROOT="/var/www/malaikanest"
BACKEND_DIR="$APP_ROOT/backend"
FRONTEND_DIR="$APP_ROOT/frontend"

is_ipv4() {
  [[ "$1" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]
}

echo "[1/8] Installing base packages..."
apt update
apt install -y nginx certbot python3-certbot-nginx fail2ban unattended-upgrades

echo "[2/8] Applying SSH hardening..."
if [ -n "$ALLOW_USER" ]; then
  ALLOW_USER="$ALLOW_USER" bash /home/mohameddosho20/malaikanest/deployment/harden-ssh.sh
fi

echo "[3/8] Applying firewall..."
SSH_ALLOW_CIDR="$SSH_ALLOW_CIDR" bash /home/mohameddosho20/malaikanest/deployment/ufw.sh

if [ -n "$PROJECT_ID" ] && [ -n "$SSH_ALLOW_CIDR" ]; then
  echo "[4/8] Applying GCP firewall rules..."
  PROJECT_ID="$PROJECT_ID" SOURCE_RANGE="$SSH_ALLOW_CIDR" bash /home/mohameddosho20/malaikanest/deployment/gcp-firewall.sh || true
fi

echo "[5/8] Configuring NGINX..."
cp /home/mohameddosho20/malaikanest/deployment/nginx-production.conf /etc/nginx/sites-available/malaikanest
ln -sf /etc/nginx/sites-available/malaikanest /etc/nginx/sites-enabled/malaikanest
rm -f /etc/nginx/sites-enabled/default

# Ensure auth rate-limit zone exists in nginx.conf
if ! grep -q 'limit_req_zone \$binary_remote_addr zone=auth_zone:10m rate=10r/m;' /etc/nginx/nginx.conf; then
  sed -i '/http {/a\    limit_req_zone $binary_remote_addr zone=auth_zone:10m rate=10r/m;' /etc/nginx/nginx.conf
fi

nginx -t
systemctl restart nginx

echo "[6/8] Configuring TLS certificate..."
if [[ -n "$DOMAIN" ]] && ! is_ipv4 "$DOMAIN"; then
  if [[ -n "$EMAIL" ]]; then
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -m "$EMAIL" --agree-tos --non-interactive --redirect
  else
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --register-unsafely-without-email --agree-tos --non-interactive --redirect
  fi
  systemctl reload nginx
else
  echo "Skipping Certbot: provide a real domain via DOMAIN=..."
fi

echo "[7/8] Enabling Fail2Ban and unattended upgrades..."
cp /home/mohameddosho20/malaikanest/deployment/fail2ban.conf /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl restart fail2ban
systemctl enable unattended-upgrades

if [ -d "$FRONTEND_DIR" ]; then
  echo "[8/8] PM2 setup for frontend..."
  npm install -g pm2
  cd "$FRONTEND_DIR"
  pm2 start npm --name "malaikanest-frontend" -- start || pm2 restart malaikanest-frontend
  pm2 save
fi

echo "=== Setup Complete ==="