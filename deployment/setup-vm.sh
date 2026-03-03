#!/bin/bash

# Malaika Nest - Complete VM Setup Script
# Run as: sudo bash setup-vm.sh

set -e

echo "=== Malaika Nest VM Setup ==="

# Update and install nginx
echo "[1/6] Installing NGINX..."
apt update && apt install nginx certbot python3-certbot-nginx -y

# Create nginx config
echo "[2/6] Configuring NGINX..."
cat > /etc/nginx/sites-available/malaikanest << 'EOF'
server {
    listen 80;
    server_name 104.154.161.10;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name 104.154.161.10;

    ssl_certificate /etc/letsencrypt/live/104.154.161.10/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/104.154.161.10/privkey.pem;
    
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_prefer_server_ciphers on;
    add_header Strict-Transport-Security "max-age=31536000" always;

    client_max_body_size 50M;

    location /static/ {
        alias /var/www/malaikanest/backend/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    location /media/ {
        alias /var/www/malaikanest/backend/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/malaikanest /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

# Create SSL cert directory (for HTTP challenge)
echo "[3/6] Setting up SSL..."
mkdir -p /var/www/certbot

# Get SSL cert (optional - for IP it may not work, but try)
certbot --nginx -d 104.154.161.10 --register-unsafely-without-email --agree-tos --non-interactive || echo "SSL skipped (IP-based certs limited)"

# Setup gunicorn systemd service
echo "[4/6] Setting up Gunicorn service..."
cat > /etc/systemd/system/malaika-gunicorn.service << 'EOF'
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

# Setup Next.js pm2 service  
echo "[5/6] Setting up Next.js service..."
npm install -g pm2
cd /var/www/malaikanest/frontend
pm2 start npm --name "malaika-frontend" -- start
pm2 save
pm2 startup

echo "[6/6] Starting services..."
systemctl restart nginx
systemctl restart malaika-gunicorn

echo "=== Setup Complete ==="
echo "Backend API: http://104.154.161.10:8000"
echo "Frontend: http://104.154.161.10:3000"
echo "NGINX: http://104.154.161.80"
