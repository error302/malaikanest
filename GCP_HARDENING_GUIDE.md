# GCP VM Production Hardening Guide — Malaika Nest

*Run all commands via SSH on your Google Cloud VM*

---

## 1. Run New Migrations on Production

```bash
cd /path/to/malaika-nest/backend
source venv/bin/activate
python manage.py migrate --settings=config.settings.prod
```

---

## 2. Rotate Credentials (Do This First)

```bash
# Update your production .env with these new values:
nano backend/.env
```

Change these values:

- `SECRET_KEY` → run `python -c "import secrets; print(secrets.token_hex(50))"`
- `GMAIL_APP_PASSWORD` → rotate at myaccount.google.com/apppasswords
- `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` → rotate at cloudinary.com
- `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY` → real Safaricom live values
- `MPESA_ENV=production`
- `PAYPAL_MODE=live` (when you have a live PayPal account)
- `FRONTEND_URL=https://yourdomain.com`
- `ADMIN_URL_SECRET=some-random-long-string-here`

---

## 3. Gunicorn — Set Worker Count

Edit your systemd service file:

```bash
sudo nano /etc/systemd/system/gunicorn.service
```

Find the `ExecStart` line and set workers based on CPU count (`nproc` on a 2-CPU GCP VM = 5 workers):

```ini
ExecStart=/path/to/venv/bin/gunicorn \
    --workers 5 \
    --worker-class gthread \
    --threads 2 \
    --timeout 120 \
    --bind unix:/run/gunicorn/gunicorn.sock \
    config.wsgi:application
```

Reload and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart gunicorn
sudo systemctl status gunicorn
```

---

## 4. Nginx — Harden Configuration

```bash
sudo nano /etc/nginx/sites-available/malaika-nest
```

Replace or merge with this hardened config:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL — Let's Encrypt certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

    # Hide Nginx version
    server_tokens off;

    # Max upload size (for product images)
    client_max_body_size 10M;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API — rate limited
    location /api/ {
        limit_req zone=api burst=40 nodelay;
        limit_conn conn_limit 20;

        proxy_pass http://unix:/run/gunicorn/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120;
    }

    # Login endpoint — tighter rate limit
    location /api/accounts/token/ {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://unix:/run/gunicorn/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. GCP Firewall Rules

In GCP Console → VPC Network → Firewall:

- **Allow**: TCP 80, 443 from all (0.0.0.0/0)
- **Allow**: TCP 22 (SSH) from **your IP only** — change to `YOUR_IP/32`
- **Delete or Disable**: Any rule allowing all TCP inbound
- **Deny**: All other inbound traffic

Or via CLI:

```bash
# Restrict SSH to your IP only
gcloud compute firewall-rules create allow-ssh-my-ip \
    --allow tcp:22 \
    --source-ranges=YOUR_IP/32 \
    --description="SSH access from trusted IP only"

# Block the default allow-all SSH rule if it exists
gcloud compute firewall-rules update default-allow-ssh --disabled
```

---

## 6. Let's Encrypt Auto-Renewal

```bash
# Verify certbot renew works
sudo certbot renew --dry-run

# Make sure the cron job exists
sudo crontab -l | grep certbot
# Should show: 0 0 * * * certbot renew --quiet
# If not, add it:
(sudo crontab -l ; echo "0 0 * * * certbot renew --quiet && systemctl reload nginx") | sudo crontab -
```

---

## 7. Automated PostgreSQL Backups

```bash
# Create a daily backup script
sudo nano /usr/local/bin/backup_db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/db_backups"
mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/malaika_$DATE.sql.gz"
# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
echo "Backup complete: malaika_$DATE.sql.gz"
```

```bash
sudo chmod +x /usr/local/bin/backup_db.sh

# Run daily at 2am
(crontab -l ; echo "0 2 * * * /usr/local/bin/backup_db.sh >> /var/log/db_backup.log 2>&1") | crontab -
```

---

## 8. Uptime Monitoring (Free)

1. Go to [uptimerobot.com](https://uptimerobot.com) → Create free account
2. Add monitor: HTTP(s) → `https://yourdomain.com/api/health/`
3. Alert email: your email
4. Check interval: 5 minutes

---

## 9. Post-Deployment Checklist

```bash
# Run Django deployment check
python manage.py check --deploy --settings=config.settings.prod

# Check gunicorn is running
sudo systemctl status gunicorn

# Check nginx
sudo systemctl status nginx

# Check SSL
curl -I https://yourdomain.com

# Check M-Pesa callback IP whitelist is active (should see your IP in logs)
sudo journalctl -u gunicorn -f | grep "M-Pesa callback"
```
