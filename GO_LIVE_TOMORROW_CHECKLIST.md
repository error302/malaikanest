# Malaika Nest Go-Live Tomorrow Checklist

Date target: tomorrow
Deployment target: `https://malaikanest.duckdns.org`

## 0) Go/No-Go Rules (hard blockers)
- No high-severity security gap open (SSH open to world, no HTTPS, or no fail2ban).
- Frontend build passes.
- `python manage.py check` passes on VM.
- Admin CRUD works (create/edit/delete product + banner).
- User path works (register/login/cart/checkout).
- Payment callback path reachable and logs successful callback processing.

If any blocker fails: do not launch paid traffic.

## 1) Pre-Deploy (30-45 min)
1. Pull latest code on VM.
2. Backend deps + frontend deps installed.
3. Environment files set with production secrets:
   - backend: `CAPTCHA_SECRET_KEY`, `MPESA_*`, `EMAIL_*`, `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
   - frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
4. Confirm SSL cert files exist under `/etc/letsencrypt/live/malaikanest.duckdns.org/`.

Pass criteria:
- No placeholder secrets in env.
- Domain resolves to VM.

## 2) Server Hardening Apply (20-30 min)
Run:
```bash
sudo ALLOW_USER="mohameddosho20" bash deployment/harden-ssh.sh
sudo SSH_ALLOW_CIDR="YOUR.IP.ADDRESS/32" bash deployment/ufw.sh
sudo cp deployment/fail2ban.conf /etc/fail2ban/jail.local
sudo systemctl enable --now fail2ban
sudo fail2ban-client status
```

Pass criteria:
- SSH only from your CIDR.
- Ports 80/443 open publicly; app ports blocked.
- `fail2ban` active and `sshd` jail enabled.

## 3) Web Stack Apply (20 min)
Run:
```bash
sudo cp deployment/nginx-production.conf /etc/nginx/sites-available/malaikanest
sudo ln -sf /etc/nginx/sites-available/malaikanest /etc/nginx/sites-enabled/malaikanest
sudo nginx -t
sudo systemctl reload nginx
```

Pass criteria:
- HTTP redirects to HTTPS.
- TLS is 1.2/1.3 only.
- Security headers present on `/` and `/api/*`.

## 4) App Deploy (20-30 min)
Backend:
```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check
sudo systemctl restart malaikanest
```

Frontend:
```bash
cd frontend
npm ci
npm run build
pm2 restart malaikanest-frontend || pm2 start npm --name malaikanest-frontend -- start
```

Pass criteria:
- No migration/check errors.
- Frontend build succeeds.
- Backend/frontend services healthy.

## 5) Data Protection + Monitoring (15 min)
Run:
```bash
sudo cp deployment/systemd/malaika_nest-backup.* /etc/systemd/system/
sudo cp deployment/systemd/malaika_nest-log-monitor.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now malaika_nest-backup.timer malaika_nest-log-monitor.timer
sudo systemctl list-timers | grep malaika_nest
```

Pass criteria:
- Backup timer enabled.
- Log monitor timer enabled.
- Backup env configured (`/etc/malaikanest/backup.env`).

## 6) Functional Validation (must pass)
### 6.1 Automated smoke
```bash
BASE_URL=https://malaikanest.duckdns.org \
ADMIN_EMAIL='admin@...' ADMIN_PASSWORD='...' \
bash deployment/go-live-smoke.sh
```

### 6.2 Manual critical path
1. Register a new user.
2. Login user.
3. Add 2 products to cart.
4. Checkout until payment initiation.
5. Trigger M-Pesa STK push.
6. Confirm payment callback updates order to paid.
7. Login admin.
8. Create product with image.
9. Edit product price/stock.
10. Delete test product.
11. Upload banner and verify homepage updates.

Pass criteria:
- All steps complete with expected status codes and UI updates.

## 7) Post-Launch First 2 Hours
- Watch backend `security.log`, app logs, nginx error logs.
- Watch 4xx/5xx rate every 10 minutes.
- Verify no spike in auth failures or blocked traffic anomalies.
- Confirm first real order paid + reflected in admin.

## 8) Rollback Plan (predefined)
If high-severity production issue:
1. Revert to last known good release/tag.
2. Restart backend + frontend.
3. Keep DB unchanged unless migration rollback is explicitly planned.
4. Post incident note with root cause and mitigation.

## Remaining Workload Snapshot
- Infra apply on VM: pending.
- Final external end-to-end validation on live domain: pending.
- Real M-Pesa callback confirmation in production: pending.
- Production backup bucket/webhook secrets: pending.

## Launch Decision
- Launch only when Sections 0-6 are all green.