# Malaika Nest — Deployment Guide
## From Fresh Ubuntu 22.04 to Live Production

> **Target environment**: Google Cloud VM, Ubuntu 22.04 LTS, 2+ vCPUs, 4 GB+ RAM  
> **Domain**: malaikanest.duckdns.org  
> **Stack**: Django 4 + Gunicorn + Celery + Redis + PostgreSQL + Next.js + Nginx + Certbot

---

## Step 0 — Prerequisites on your LOCAL machine

```bash
# SSH to your VM (replace with your actual IP)
ssh -i ~/.ssh/your-key ubuntu@<VM_PUBLIC_IP>

# Once on the VM, escalate to root for setup steps
sudo -i
```

---

## Step 1 — System Packages

```bash
apt update && apt upgrade -y
apt install -y \
    git curl wget gnupg2 ca-certificates lsb-release \
    build-essential libssl-dev libffi-dev python3-dev python3-pip python3-venv \
    postgresql postgresql-contrib libpq-dev \
    redis-server \
    nginx certbot python3-certbot-nginx \
    fail2ban ufw \
    supervisor \
    nodejs npm

# Install Node 20 LTS (required for Next.js build)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version   # should print v20.x.x
```

---

## Step 2 — Firewall

```bash
# Only allow SSH, HTTP, HTTPS
bash /var/www/malaikanest/deployment/ufw.sh

# Verify
ufw status verbose
# Expected: 22/tcp, 80/tcp, 443/tcp ALLOW
```

---

## Step 3 — PostgreSQL Setup

```bash
# Run as postgres user
sudo -u postgres psql <<'SQL'
CREATE USER malaika_user WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
CREATE DATABASE malaika_production OWNER malaika_user;
GRANT ALL PRIVILEGES ON DATABASE malaika_production TO malaika_user;
SQL

# Verify connection
psql -U malaika_user -h localhost -d malaika_production -c '\conninfo'
```

---

## Step 4 — Redis

```bash
systemctl enable redis-server
systemctl start redis-server
redis-cli ping   # Expected: PONG
```

---

## Step 5 — Clone Repository

```bash
mkdir -p /var/www/malaikanest
cd /var/www/malaikanest

git clone https://github.com/YOUR_USERNAME/malaika-nest.git .
# Or if repo already exists:
git pull origin main

chown -R www-data:www-data /var/www/malaikanest
```

---

## Step 6 — Python Virtual Environment & Dependencies

```bash
cd /var/www/malaikanest/backend

python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip wheel
pip install -r requirements.txt

# Verify Django can import settings
DJANGO_SETTINGS_MODULE=config.settings.prod python manage.py check --deploy
```

---

## Step 7 — Environment Variables

```bash
# Copy the example and fill in every value
cp /var/www/malaikanest/backend/.env.example /var/www/malaikanest/backend/.env.production

# REQUIRED variables — fill these before continuing:
nano /var/www/malaikanest/backend/.env.production
```

**Minimum required values in `.env.production`**:

| Variable | Description |
|---|---|
| `SECRET_KEY` | 50-char random hex: `python -c "import secrets; print(secrets.token_hex(50))"` |
| `DB_NAME` | `malaika_production` |
| `DB_USER` | `malaika_user` |
| `DB_PASSWORD` | Strong password set in Step 3 |
| `DB_HOST` | `localhost` |
| `ALLOWED_HOSTS` | `malaikanest.duckdns.org,www.malaikanest.duckdns.org` |
| `CORS_ALLOWED_ORIGINS` | `https://malaikanest.duckdns.org` |
| `REDIS_URL` | `redis://127.0.0.1:6379/0` |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `MPESA_CONSUMER_KEY` | Safaricom Daraja production credentials |
| `MPESA_CONSUMER_SECRET` | Safaricom Daraja production credentials |
| `MPESA_SHORTCODE` | Your M-Pesa business shortcode |
| `MPESA_PASSKEY` | From Safaricom Daraja portal |
| `MPESA_CALLBACK_URL` | `https://malaikanest.duckdns.org/api/v1/payments/mpesa/callback/` |
| `MPESA_ENV` | `live` |
| `EMAIL_HOST` | SMTP host (e.g., `smtp.gmail.com`) |
| `EMAIL_HOST_USER` | Sending email address |
| `EMAIL_HOST_PASSWORD` | App password / SMTP password |

---

## Step 8 — Database Migrations & Static Files

```bash
cd /var/www/malaikanest/backend
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=config.settings.prod
export DJANGO_ENV=prod

# Run migrations
python manage.py migrate --no-input

# Collect static files
python manage.py collectstatic --no-input

# Create superuser (run once)
python manage.py createsuperuser
```

---

## Step 9 — Systemd Services

```bash
cd /var/www/malaikanest

# Install all service files
bash deployment/install_systemd.sh

# Enable and start
systemctl daemon-reload
systemctl enable gunicorn celery celerybeat
systemctl start gunicorn celery celerybeat

# Verify
systemctl status gunicorn    # Active: active (running)
systemctl status celery      # Active: active (running)
systemctl status celerybeat  # Active: active (running)

# Check socket was created
ls -la /run/gunicorn/malaikanest.sock
```

---

## Step 10 — Nginx

```bash
# Copy production nginx config
cp /var/www/malaikanest/deployment/nginx-production.conf \
   /etc/nginx/sites-available/malaikanest

ln -sf /etc/nginx/sites-available/malaikanest \
       /etc/nginx/sites-enabled/malaikanest

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Add rate limit zones to nginx http context
cat >> /etc/nginx/nginx.conf << 'EOF'

# Malaika Nest rate limiting zones
limit_req_zone $binary_remote_addr zone=api_general:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=api_payments:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=auth_zone:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api_products:10m rate=60r/s;
EOF

# Test and reload
nginx -t && systemctl reload nginx
```

---

## Step 11 — SSL Certificate (Certbot)

```bash
# Obtain certificate — Nginx plugin handles all configuration
certbot --nginx \
    -d malaikanest.duckdns.org \
    -d www.malaikanest.duckdns.org \
    --non-interactive \
    --agree-tos \
    --email admin@malaikanest.duckdns.org \
    --redirect

# Verify auto-renewal works
certbot renew --dry-run

# The auto-renewal cron is installed by certbot at:
# /etc/cron.d/certbot  OR  /etc/systemd/system/certbot.timer
systemctl list-timers | grep certbot
```

---

## Step 12 — Frontend (Next.js)

```bash
cd /var/www/malaikanest/frontend

# Copy and fill frontend env
cp .env.production.example .env.production
# Set NEXT_PUBLIC_API_URL=https://malaikanest.duckdns.org

npm ci --legacy-peer-deps
npm run build

# Start with PM2 (or systemctl frontend.service)
systemctl enable frontend
systemctl start frontend
systemctl status frontend   # Active: active (running)
```

---

## Step 13 — Fail2Ban

```bash
cp /var/www/malaikanest/deployment/fail2ban.conf /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl restart fail2ban

# Verify all jails loaded
fail2ban-client status
# Expected jails: sshd, nginx-http-auth, nginx-limit-req, nginx-botsearch,
#                 malaikanest-mpesa-abuse, recidive
fail2ban-client status malaikanest-mpesa-abuse
```

---

## Step 14 — Backup Cron

```bash
# Create backup directory
mkdir -p /var/backups/malaikanest
chown www-data:www-data /var/backups/malaikanest

# Make backup script executable
chmod +x /var/www/malaikanest/deployment/backup.sh

# Install daily cron at 02:00 EAT
crontab -u www-data -l > /tmp/crontab_backup
echo "0 2 * * * PG_USER=malaika_user PG_DB=malaika_production RETENTION_DAYS=7 /var/www/malaikanest/deployment/backup.sh >> /var/log/malaikanest/backup.log 2>&1" >> /tmp/crontab_backup
crontab -u www-data /tmp/crontab_backup

# Create log directory
mkdir -p /var/log/malaikanest
chown www-data:www-data /var/log/malaikanest
```

---

## Step 15 — Smoke Test

```bash
# Run the built-in smoke test
bash /var/www/malaikanest/deployment/go-live-smoke.sh

# Manual spot checks
curl -I https://malaikanest.duckdns.org/                                    # 200
curl -I https://malaikanest.duckdns.org/api/v1/products/products/           # 200
curl -I https://malaikanest.duckdns.org/api/v1/products/categories/         # 200
curl -s https://malaikanest.duckdns.org/api/v1/products/products/ | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print('OK, products:', len(d.get('results',d.get('data',{}).get('results',[]))))"
```

---

## Ongoing Maintenance

```bash
# Deploy code update
git -C /var/www/malaikanest pull origin main
cd /var/www/malaikanest/backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --no-input
python manage.py collectstatic --no-input
systemctl restart gunicorn celery celerybeat

# Deploy frontend update
cd /var/www/malaikanest/frontend
npm ci --legacy-peer-deps
npm run build
systemctl restart frontend

# View live logs
journalctl -u gunicorn -f
journalctl -u celery -f
tail -f /var/log/malaikanest/production.json.log | python3 -m json.tool
```
