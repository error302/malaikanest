#!/bin/bash
set -e

echo "============================================"
echo "  Malaika Nest - Production Deploy Script"
echo "============================================"
echo ""

# Configuration
DOMAIN="${DOMAIN:-malaikanest.shop}"
SERVER_IP="${SERVER_IP}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@malaikanest.com}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
MPESA_CONSUMER_KEY="${MPESA_CONSUMER_KEY}"
MPESA_CONSUMER_SECRET="${MPESA_CONSUMER_SECRET}"
MPESA_PASSKEY="${MPESA_PASSKEY}"
CLOUDINARY_NAME="${CLOUDINARY_NAME}"
CLOUDINARY_KEY="${CLOUDINARY_KEY}"
CLOUDINARY_SECRET="${CLOUDINARY_SECRET}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  log_error "Please run as root (sudo ./deploy.sh)"
  exit 1
fi

# Validate required variables
if [ -z "$DOMAIN" ]; then
  log_error "DOMAIN not set. Usage: DOMAIN=malaikanest.shop sudo ./deploy.sh"
  exit 1
fi

log_info "Starting deployment for $DOMAIN..."

#============================================
# Step 1: System Setup
#============================================
log_info "Step 1: Updating system packages..."
apt update && apt upgrade -y

log_info "Installing required packages..."
apt install -y curl wget git nginx postgresql postgresql-contrib redis-server \
    python3 python3-pip python3-venv certbot python3-certbot-nginx \
    fail2ban ufw libpq-dev build-essential

#============================================
# Step 2: PostgreSQL Setup
#============================================
log_info "Step 2: Setting up PostgreSQL..."

systemctl enable postgresql
systemctl start postgresql

# Create database and user
su - postgres -c "psql -c \"CREATE USER kenya_user WITH PASSWORD '$POSTGRES_PASSWORD';\"" 2>/dev/null || true
su - postgres -c "psql -c \"CREATE DATABASE kenya_ecom OWNER kenya_user;\"" 2>/dev/null || true
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE kenya_ecom TO kenya_user;\"" 2>/dev/null || true
su - postgres -c "psql -d kenya_ecom -c \"GRANT ALL ON SCHEMA public TO kenya_user;\"" 2>/dev/null || true

# PostgreSQL tuning
cat >> /etc/postgresql/15/main/conf.d/malaika.conf << 'EOF'
# Malaika Nest - Production Tuning
max_connections = 50
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
EOF

systemctl restart postgresql

#============================================
# Step 3: Redis Setup
#============================================
log_info "Step 3: Setting up Redis..."
systemctl enable redis-server
systemctl start redis-server

#============================================
# Step 4: Create Application User & Directory
#============================================
log_info "Step 4: Creating application directory..."
useradd -m -s /bin/bash appuser 2>/dev/null || true
mkdir -p /var/www/malaikanest
chown -R appuser:appuser /var/www/malaikanest

# Clone or copy application
cd /var/www/malaikanest
# Copy existing project files if not already there
if [ ! -f "manage.py" ]; then
    log_warn "Please ensure backend code is in /var/www/malaikanest/backend"
fi

#============================================
# Step 5: Python Virtual Environment
#============================================
log_info "Step 5: Setting up Python environment..."
cd /var/www/malaikanest/backend
python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

#============================================
# Step 6: Environment Configuration
#============================================
log_info "Step 6: Configuring environment variables..."
cat > /var/www/malaikanest/backend/.env << EOF
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(50))')
DEBUG=False
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kenya_ecom
DB_USER=kenya_user
DB_PASSWORD=$POSTGRES_PASSWORD
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Cloudinary
CLOUDINARY_URL=cloudinary://$CLOUDINARY_KEY:$CLOUDINARY_SECRET@$CLOUDINARY_NAME

# JWT
SIMPLE_JWT_SECRET=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
ACCESS_TOKEN_LIFETIME=300
REFRESH_TOKEN_LIFETIME=86400

# M-Pesa
MPESA_CONSUMER_KEY=$MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET=$MPESA_CONSUMER_SECRET
MPESA_SHORTCODE=174379
MPESA_PASSKEY=$MPESA_PASSKEY
MPESA_ENV=production
MPESA_CALLBACK_URL=https://$DOMAIN/api/payments/mpesa/callback/

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=True
EOF

chown appuser:appuser /var/www/malaikanest/backend/.env
chmod 600 /var/www/malaikanest/backend/.env

#============================================
# Step 7: Database Migrations
#============================================
log_info "Step 7: Running database migrations..."
cd /var/www/malaikanest/backend
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=config.settings
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Create superuser (non-interactive)
echo "from apps.accounts.models import User; User.objects.filter(email='$ADMIN_EMAIL').exists() or User.objects.create_superuser('$ADMIN_EMAIL', 'admin123', '$ADMIN_EMAIL')" | python manage.py shell

#============================================
# Step 8: Systemd Services
#============================================
log_info "Step 8: Creating systemd services..."

# Gunicorn
cat > /etc/systemd/system/malaikanest-gunicorn.service << 'EOF'
[Unit]
Description=Malaika Nest Gunicorn
After=network.target

[Service]
Type=notify
User=appuser
Group=appuser
WorkingDirectory=/var/www/malaikanest/backend
Environment="PATH=/var/www/malaikanest/backend/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=config.settings"
ExecStart=/var/www/malaikanest/backend/venv/bin/gunicorn config.asgi:application -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Celery Worker
cat > /etc/systemd/system/malaikanest-celery.service << 'EOF'
[Unit]
Description=Malaika Nest Celery
After=network.target redis.service

[Service]
Type=forking
User=appuser
Group=appuser
WorkingDirectory=/var/www/malaikanest/backend
Environment="PATH=/var/www/malaikanest/backend/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=config.settings"
ExecStart=/var/www/malaikanest/backend/venv/bin/celery -A config worker --loglevel=info --concurrency=4 --logfile=/var/log/celery/celery.log --pidfile=/var/run/celery/celery.pid
ExecStop=/bin/kill -s TERM $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Celery Beat
cat > /etc/systemd/system/malaikanest-celerybeat.service << 'EOF'
[Unit]
Description=Malaika Nest Celery Beat
After=network.target redis.service

[Service]
Type=simple
User=appuser
Group=appuser
WorkingDirectory=/var/www/malaikanest/backend
Environment="PATH=/var/www/malaikanest/backend/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=config.settings"
ExecStart=/var/www/malaikanest/backend/venv/bin/celery -A config beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler --logfile=/var/log/celery/celerybeat.log
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Create required directories
mkdir -p /var/log/celery /var/run/celery
chown -R appuser:appuser /var/log/celery /var/run/celery

systemctl daemon-reload
systemctl enable malaikanest-gunicorn malaikanest-celery malaikanest-celerybeat
systemctl start malaikanest-gunicorn

#============================================
# Step 9: Frontend Build
#============================================
log_info "Step 9: Building frontend..."
cd /var/www/malaikanest/frontend

# Update API URL
echo "NEXT_PUBLIC_API_URL=https://$DOMAIN/api" > .env.production
echo "NEXT_PUBLIC_SITE_URL=https://$DOMAIN" >> .env.production

npm ci
npm run build

#============================================
# Step 10: Nginx Configuration
#============================================
log_info "Step 10: Configuring Nginx..."

# Stop nginx for certbot
systemctl stop nginx

# Obtain SSL certificate
certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $ADMIN_EMAIL

# Nginx configuration
cat > /etc/nginx/sites-available/malaikanest << EOF
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Frontend (Next.js static)
    location / {
        root /var/www/malaikanest/frontend/.next/server/pages;
        try_files \$uri \$uri.html \$uri/ /index.html;
        index index.html;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    # Admin static
    location /static/ {
        alias /var/www/malaikanest/backend/staticfiles/;
        expires 30d;
    }

    # Media
    location /media/ {
        alias /var/www/malaikanest/backend/media/;
        expires 30d;
    }

    # WebSocket for Celery
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -sf /etc/nginx/sites-available/malaikanest /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

#============================================
# Step 11: Firewall
#============================================
log_info "Step 11: Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

#============================================
# Step 12: Fail2Ban
#============================================
log_info "Step 12: Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
maxretry = 6
EOF

systemctl enable fail2ban
systemctl start fail2ban

#============================================
# Step 13: SSL Renewal Timer
#============================================
log_info "Step 13: Setting up SSL auto-renewal..."
cat > /etc/systemd/system/malaikanest-renew.service << 'EOF'
[Unit]
Description=Renew SSL certificates
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF

cat > /etc/systemd/system/malaikanest-renew.timer << 'EOF'
[Unit]
Description=Daily SSL renewal check
Requires=malaikanest-renew.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable malaikanest-renew.timer
systemctl start malaikanest-renew.timer

#============================================
# Step 14: Backup Script
#============================================
log_info "Step 14: Creating backup script..."
cat > /usr/local/bin/malaika-backup.sh << 'SCRIPT'
#!/bin/bash
BACKUP_DIR="/var/backups/malaikanest"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U kenya_user kenya_ecom > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 backups
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

# Media files backup
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /var/www/malaikanest/backend/media 2>/dev/null
find $BACKUP_DIR -name "media_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
SCRIPT

chmod +x /usr/local/bin/malaika-backup.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/malaika-backup.sh") | crontab -

#============================================
# Final Status
#============================================
log_info "============================================"
log_info "  Deployment Complete!"
log_info "============================================"
log_info ""
log_info "Site URL: https://$DOMAIN"
log_info "Admin URL: https://$DOMAIN/admin"
log_info ""
log_info "Admin credentials:"
log_info "  Email: $ADMIN_EMAIL"
log_info "  Password: admin123"
log_info ""
log_info "Services status:"
systemctl status malaikanest-gunicorn --no-pager || true
log_info ""
log_info "Next steps:"
log_info "1. Update DNS A records to point to this server"
log_info "2. Add M-Pesa production credentials in admin panel"
log_info "3. Upload product images"
log_info "4. Test the full flow"
