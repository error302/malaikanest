#!/bin/bash

# Malaika Nest - VM Setup Script
# Run as: sudo DOMAIN=shop.example.com EMAIL=ops@example.com bash setup-vm.sh

set -euo pipefail

echo "=== Malaika Nest VM Setup ==="

DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
APP_ROOT="/var/www/malaikanest"
BACKEND_DIR="$APP_ROOT/backend"
FRONTEND_DIR="$APP_ROOT/frontend"

is_ipv4() {
  [[ "$1" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]
}

PUBLIC_IP="$(hostname -I | awk '{print $1}')"
if [[ -z "$PUBLIC_IP" ]]; then
  PUBLIC_IP="SERVER_IP"
fi

echo "[1/6] Installing NGINX and Certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

echo "[2/6] Configuring NGINX reverse proxy..."
SERVER_NAME="_"
if [[ -n "$DOMAIN" ]]; then
  SERVER_NAME="$DOMAIN"
fi

cat > /etc/nginx/sites-available/malaikanest <<EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location /static/ {
        alias ${BACKEND_DIR}/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias ${BACKEND_DIR}/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

mkdir -p /var/www/certbot
ln -sf /etc/nginx/sites-available/malaikanest /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "[3/6] Configuring TLS certificate..."
TLS_ENABLED="false"
if [[ -n "$DOMAIN" ]] && ! is_ipv4 "$DOMAIN"; then
  if [[ -n "$EMAIL" ]]; then
    certbot --nginx -d "$DOMAIN" -m "$EMAIL" --agree-tos --non-interactive --redirect
  else
    certbot --nginx -d "$DOMAIN" --register-unsafely-without-email --agree-tos --non-interactive --redirect
  fi
  TLS_ENABLED="true"
  systemctl reload nginx
else
  echo "Skipping Certbot: provide a real domain via DOMAIN=... (Let's Encrypt does not issue certs for raw IP addresses)."
fi

echo "[4/6] Setting up Gunicorn service..."
cat > /etc/systemd/system/malaika-gunicorn.service <<'EOF'
[Unit]
Description=Malaika Nest Gunicorn
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/malaikanest/backend
ExecStart=/var/www/malaikanest/venv/bin/gunicorn kenya_ecom.wsgi:application --bind 127.0.0.1:8000 --workers 3 --log-level=info
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable malaika-gunicorn

echo "[5/6] Setting up Next.js service..."
npm install -g pm2
cd "$FRONTEND_DIR"
pm2 start npm --name "malaika-frontend" -- start
pm2 save
pm2 startup

echo "[6/6] Starting services..."
systemctl restart malaika-gunicorn
systemctl restart nginx

BASE_URL="http://${PUBLIC_IP}"
if [[ "$TLS_ENABLED" == "true" ]]; then
  BASE_URL="https://${DOMAIN}"
fi

echo "=== Setup Complete ==="
echo "Site URL: ${BASE_URL}"
echo "API URL: ${BASE_URL}/api/"
echo "Gunicorn bind: 127.0.0.1:8000 (internal only)"
echo "Nginx listen ports: 80 (and 443 when TLS is enabled)"
