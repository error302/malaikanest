# Deployment guide — VPS (Ubuntu 22.04+) for Malaika Nest

This file contains copy-paste commands and pointers to deploy the stack on a VPS using Docker Compose, obtain TLS via Certbot, and set basic production hardening.

1) Server prep (run as a non-root sudo user)

```bash
sudo apt update && sudo apt upgrade -y
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
sudo usermod -aG docker $USER
# Install Docker Compose plugin (if not installed)
sudo apt install -y docker-compose-plugin
# Optional: enable unattended upgrades, fail2ban, and UFW
sudo apt install -y ufw fail2ban
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable
```

2) Clone repo and prepare env

```bash
# on the VPS
git clone <your-repo-url> malaika_nest
cd malaika_nest
cp .env.production.example .env.production
# Edit .env.production with production values (SECRET_KEY, DB credentials, ALLOWED_HOSTS, CLOUDINARY_URL, payment keys, NEXT_PUBLIC_API_URL=https://yourdomain.com)
nano .env.production
```

3) Build and run with Docker Compose (production)

```bash
# Build images and start services
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d

# Watch logs
docker compose -f docker-compose.prod.yml logs -f
```

Notes:
- `docker-compose.prod.yml` expects `.env.production` in repository root and mounts `./certbot` for Let’s Encrypt data.
- The `nginx` service is configured to serve Challenges for Certbot; next step obtains certificates.

4) Obtain TLS certificates (using certbot container in repo)

```bash
# Request certs (replace yourdomain.com)
docker compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d yourdomain.com -d www.yourdomain.com --email admin@yourdomain.com --agree-tos --no-eff-email

# After successful run, restart nginx
docker compose -f docker-compose.prod.yml restart nginx
```

If certbot run from container fails, use Certbot on host or follow certbot docs. Ensure DNS A records point to VPS IP.

5) Database backups and migrations

```bash
# Run migrations (from backend container)
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate --noinput
# Create superuser interactively
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
# Healthcheck
docker compose -f docker-compose.prod.yml exec backend python manage.py healthcheck

Helper script

I've added a small helper script at `deployment/run_migrations.sh` to run migrations,
collect static files and seed categories in one step. On the VPS run:

```bash
sudo bash deployment/run_migrations.sh /home/ubuntu/malaika_nest
```

The script assumes `docker compose -f docker-compose.prod.yml` is the compose command in your repo root. Adjust the path or compose filename as needed.
```

6) Systemd (optional): keep compose running on reboot

Create `/etc/systemd/system/malaika_nest.service` with:

```ini
[Unit]
Description=Malaika Nest Docker Compose
After=network.target docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/malaika_nest
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now malaika_nest.service
```

Automated healthchecks & cert renewals (systemd timers)

The repo now includes helper scripts and systemd unit templates in `deployment/`:

- `deployment/healthcheck.sh` — runs `python manage.py healthcheck` inside the backend container and restarts the backend on failure.
- `deployment/renew_certs.sh` — runs `certbot renew` via the `certbot` container and restarts `nginx` when certificates are updated.
- `deployment/systemd/malaika_nest-health.service` + `malaika_nest-health.timer` — run the healthcheck every 15 minutes.
- `deployment/systemd/malaika_nest-renew.service` + `malaika_nest-renew.timer` — run certificate renewal weekly.

Before enabling, edit the `WorkingDirectory` path and service `User` inside the unit files to match your VPS layout (default uses `/home/ubuntu/malaika_nest`).

To install and enable the timers on the server:

```bash
# Use the included installer script (preferred) - run as sudo
sudo bash deployment/install_systemd.sh /home/ubuntu/malaika_nest ubuntu

# OR copy manually (if you prefer):
sudo cp deployment/systemd/malaika_nest-*.service /etc/systemd/system/
sudo cp deployment/systemd/malaika_nest-*.timer /etc/systemd/system/
sudo cp deployment/healthcheck.sh /usr/local/bin/malaika_healthcheck.sh
sudo cp deployment/renew_certs.sh /usr/local/bin/malaika_renew_certs.sh
sudo chmod +x /usr/local/bin/malaika_healthcheck.sh /usr/local/bin/malaika_renew_certs.sh

# Reload and enable timers
sudo systemctl daemon-reload
sudo systemctl enable --now malaika_nest-health.timer
sudo systemctl enable --now malaika_nest-renew.timer

# Check status
sudo systemctl status malaika_nest-health.timer
sudo systemctl list-timers | grep malaika_nest
```

Logs will be written to the `logs/` directory inside your repo by default (ensure it's writable by the service user).

Notifications

Set `NOTIFY_WEBHOOK` as an environment variable on the VPS (in the shell that runs the installer or in your systemd unit environment) to send simple alerts to a Slack-compatible incoming webhook. Example payload is a JSON object with a `text` field.

Example (on the server before enabling timers):

```bash
export NOTIFY_WEBHOOK="https://hooks.slack.com/services/T/IIII/XXXX"
# then run the install or copy the files; systemd units will invoke the scripts which will use the env var if present
```


7) Security & monitoring checklist (recommended)
- Set `DEBUG=False` and ensure `ALLOWED_HOSTS` is set.
- Use strong `SECRET_KEY` and rotate any keys that were committed.
- Run Sentry for error monitoring; add `SENTRY_DSN` to env and configure SDK.
- Configure fail2ban and UFW (done above). Consider Cloudflare WAF before the VPS.
- Enable automatic backups for Postgres and uploaded media (Cloudinary recommended).
- Add TLS renewal cron to run `docker compose run --rm certbot renew` regularly (certbot does this if installed on host; with container, add a cron or systemd timer).

8) Rollback and maintenance
- Keep database dumps off-site. Before major deploys, run `pg_dump` and snapshot VPS.

9) Remove committed sensitive files and virtualenv (important)

If you accidentally committed secrets or a Python `venv`, remove them from the index and rotate secrets immediately. On your local machine (not the server):

```bash
# stop tracking the virtualenv directory and any env files
git rm -r --cached backend/venv || true
git rm --cached backend/.env.production || true
git rm --cached backend/.env || true
git commit -m "remove tracked env and venv files"
git push
```

This removes files from the current tree but they will still exist in git history. To purge secrets from history use a tool like `bfg` or `git filter-repo` and then rotate any secrets (Cloudinary, Stripe, JWT keys, DB passwords) immediately.

Recommended quick actions after removing files:

```bash
# Create example env file and keep secrets only in the VPS environment
cp backend/.env.production.example backend/.env.production
# Rotate API keys and update secrets in the VPS
# Use a secrets manager where possible (Vault, AWS Secrets Manager, etc.)
```

If you want, I can generate a `systemd` unit that runs healthchecks and rotates logs after deploy. Reply and I will add it to the repo.
