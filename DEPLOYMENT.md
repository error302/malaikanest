Production deployment guide for Ubuntu 22.04

1. Create user and system dirs

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /opt/kenya_baby_ecommerce
sudo chown deploy:deploy /opt/kenya_baby_ecommerce
```

2. Install system deps

```bash
sudo apt update
sudo apt install -y python3.10 python3-venv python3-pip nginx postgresql postgresql-contrib redis-server git curl fail2ban ufw certbot python3-certbot-nginx
```

3. Setup PostgreSQL

```bash
sudo -u postgres psql -c "CREATE USER kenya_user WITH PASSWORD 'strong_db_password';"
sudo -u postgres psql -c "CREATE DATABASE kenya_ecom OWNER kenya_user;"
```

4. Clone project and create venv

```bash
sudo -u deploy -H bash -lc "git clone <repo> /opt/kenya_baby_ecommerce && cd /opt/kenya_baby_ecommerce/backend && python3 -m venv /opt/venv && /opt/venv/bin/pip install -r requirements.txt"
```

5. Configure environment

Copy `.env.example` to `.env` and populate secrets.

6. Migrate and collectstatic

```bash
sudo -u deploy -H bash -lc "cd /opt/kenya_baby_ecommerce/backend && /opt/venv/bin/python manage.py migrate && /opt/venv/bin/python manage.py collectstatic --noinput"
```

7. Setup systemd services

Copy `deployment/gunicorn.service`, `deployment/frontend.service`, `deployment/celery.service`, and `deployment/celerybeat.service` to `/etc/systemd/system/` and reload systemd

```bash
sudo cp deployment/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gunicorn
sudo systemctl enable --now frontend
sudo systemctl enable --now celery
sudo systemctl enable --now celerybeat
```

8. Configure Nginx

```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/kenya_baby_ecommerce
sudo ln -s /etc/nginx/sites-available/kenya_baby_ecommerce /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

9. Obtain SSL with Certbot

```bash
sudo certbot --nginx -d your.server.domain
```

10. Firewall

```bash
sudo bash deployment/ufw.sh
```

11. Backups

Setup cron for `backup.sh` to run daily as root or backup user.

12. Monitoring

Check logs in `/var/log/` and configure logrotate as needed.

13. Celery & Redis

Ensure Redis is running: `sudo systemctl enable --now redis-server`

14. Final checklist
- Populate `.env` with production secrets
- Validate M-Pesa credentials with Safaricom
- Add admin user: `/opt/venv/bin/python manage.py createsuperuser`

