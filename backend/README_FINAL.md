FINAL DEPLOYMENT CHECKLIST & QUICK COMMANDS

1. Create system user and directories

sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /opt/kenya_baby_ecommerce
sudo chown deploy:deploy /opt/kenya_baby_ecommerce

2. Install packages

sudo apt update
sudo apt install -y python3.10 python3-venv python3-pip nginx postgresql postgresql-contrib redis-server git curl fail2ban ufw certbot python3-certbot-nginx build-essential libpq-dev

3. Setup PostgreSQL

sudo -u postgres psql -c "CREATE USER kenya_user WITH PASSWORD 'strong_db_password';"
sudo -u postgres psql -c "CREATE DATABASE kenya_ecom OWNER kenya_user;"

4. Clone and install

sudo -u deploy -H bash -lc "git clone <repo> /opt/kenya_baby_ecommerce && cd /opt/kenya_baby_ecommerce/backend && python3 -m venv /opt/venv && /opt/venv/bin/pip install -r requirements.txt"

5. Environment

cp .env.example .env
# edit .env with production values including MPESA keys, DB password, SECRET_KEY, SIMPLE_JWT_SECRET

6. Migrate, collectstatic

/opt/venv/bin/python manage.py migrate
/opt/venv/bin/python manage.py collectstatic --noinput

7. Create systemd service units and nginx config

sudo cp deployment/*.service /etc/systemd/system/
sudo cp deployment/nginx.conf /etc/nginx/sites-available/kenya_baby_ecommerce
sudo ln -s /etc/nginx/sites-available/kenya_baby_ecommerce /etc/nginx/sites-enabled/

sudo systemctl daemon-reload
sudo systemctl enable --now gunicorn
sudo systemctl enable --now celery
sudo systemctl enable --now celerybeat

8. Obtain SSL

sudo certbot --nginx -d your.server.domain

9. Firewall

sudo bash deployment/ufw.sh

10. Cron/backup

sudo cp deployment/backup.sh /usr/local/bin/kenya_backup.sh
sudo chmod +x /usr/local/bin/kenya_backup.sh
# add to root crontab: 0 2 * * * /usr/local/bin/kenya_backup.sh

11. Verify

/opt/venv/bin/python manage.py check
systemctl status gunicorn
systemctl status celery
systemctl status redis-server

