# Malaika Nest — Production Readiness Checklist
## Every item is verifiable with the command shown

---

### 🔒 Security

- [ ] **1. SECRET_KEY is not the default**
  ```bash
  grep SECRET_KEY /var/www/malaikanest/backend/.env.production | grep -v "changeme\|example\|your-"
  ```

- [ ] **2. DEBUG is False in production**
  ```bash
  cd /var/www/malaikanest/backend && source venv/bin/activate
  DJANGO_ENV=prod python -c "from config.settings.prod import DEBUG; assert not DEBUG, 'DEBUG is True!'; print('OK')"
  ```

- [ ] **3. HTTPS redirect is enforced (HTTP → HTTPS)**
  ```bash
  curl -I http://malaikanest.duckdns.org/ | grep -E "HTTP|Location"
  # Expected: 301 → https://...
  ```

- [ ] **4. HSTS header present**
  ```bash
  curl -sI https://malaikanest.duckdns.org/ | grep -i strict-transport
  # Expected: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  ```

- [ ] **5. X-Frame-Options: DENY**
  ```bash
  curl -sI https://malaikanest.duckdns.org/ | grep -i x-frame-options
  # Expected: X-Frame-Options: DENY
  ```

- [ ] **6. Content-Type-Options: nosniff**
  ```bash
  curl -sI https://malaikanest.duckdns.org/ | grep -i x-content-type
  # Expected: X-Content-Type-Options: nosniff
  ```

- [ ] **7. Admin URL is NOT /admin/**
  ```bash
  curl -I https://malaikanest.duckdns.org/admin/ | grep HTTP
  # Expected: 404 (admin is at /manage-store/ not /admin/)
  ```

- [ ] **8. UFW only allows ports 22, 80, 443**
  ```bash
  sudo ufw status verbose | grep ALLOW
  # Only lines with 22, 80, 443 should appear
  ```

- [ ] **9. Fail2Ban running with M-Pesa jail active**
  ```bash
  sudo fail2ban-client status malaikanest-mpesa-abuse
  # Status: Active — Jail, Filter, Actions all listed
  ```

- [ ] **10. SSL certificate is valid and auto-renewed**
  ```bash
  certbot renew --dry-run && echo "Auto-renewal OK"
  openssl s_client -connect malaikanest.duckdns.org:443 < /dev/null 2>/dev/null | openssl x509 -noout -dates
  ```

---

### 🗄️ Database

- [ ] **11. PostgreSQL is running and accessible**
  ```bash
  sudo systemctl status postgresql | grep Active
  psql -U malaika_user -h localhost -d malaika_production -c "SELECT version();"
  ```

- [ ] **12. All migrations applied (zero pending)**
  ```bash
  cd /var/www/malaikanest/backend && source venv/bin/activate
  DJANGO_ENV=prod python manage.py showmigrations | grep "\[ \]"
  # Expected: no output (all migrations applied)
  ```

- [ ] **13. Database connection from Gunicorn worker works**
  ```bash
  curl -s https://malaikanest.duckdns.org/api/v1/products/products/ | python3 -c "import sys,json; d=json.load(sys.stdin); print('DB OK, rows:', d.get('count', '?'))"
  ```

---

### 🛒 API Endpoints

- [ ] **14. Products API returns results**
  ```bash
  curl -s https://malaikanest.duckdns.org/api/v1/products/products/ | python3 -m json.tool | head -20
  ```

- [ ] **15. Categories API returns results**
  ```bash
  curl -s https://malaikanest.duckdns.org/api/v1/products/categories/ | python3 -m json.tool | head -20
  ```

- [ ] **16. Payment status endpoint rejects unauthenticated requests**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" https://malaikanest.duckdns.org/api/v1/payments/1/status/
  # Expected: 401
  ```

- [ ] **17. M-Pesa callback endpoint returns 200 (always, even for invalid data)**
  ```bash
  curl -s -w "\nHTTP %{http_code}\n" \
    -X POST https://malaikanest.duckdns.org/api/v1/payments/mpesa/callback/ \
    -H "Content-Type: application/json" \
    -d '{"Body":{"stkCallback":{"CheckoutRequestID":"test","ResultCode":1,"ResultDesc":"Test"}}}'
  # Expected: HTTP 200 (Safaricom always needs 200)
  ```

---

### 🔧 Services

- [ ] **18. All systemd services active**
  ```bash
  for svc in gunicorn celery celerybeat nginx postgresql redis-server; do
    echo -n "$svc: "
    systemctl is-active $svc
  done
  # Expected: all show "active"
  ```

- [ ] **19. Gunicorn socket exists and is writable by www-data**
  ```bash
  ls -la /run/gunicorn/malaikanest.sock
  sudo -u www-data test -w /run/gunicorn/malaikanest.sock && echo "Writable OK"
  ```

- [ ] **20. Celery worker can beat (beat schedule registered)**
  ```bash
  cd /var/www/malaikanest/backend && source venv/bin/activate
  DJANGO_ENV=prod celery -A config.celery inspect scheduled 2>/dev/null | grep reconcile
  # Expected: "payments-reconcile-every-15-min" listed
  ```

---

### 📁 Media & Storage

- [ ] **21. Cloudinary is configured and reachable**
  ```bash
  cd /var/www/malaikanest/backend && source venv/bin/activate
  DJANGO_ENV=prod python -c "
  import cloudinary, cloudinary.api, os
  r = cloudinary.api.ping()
  print('Cloudinary OK:', r)
  "
  ```

- [ ] **22. Static files are served correctly**
  ```bash
  curl -I https://malaikanest.duckdns.org/static/admin/css/base.css | grep -E "HTTP|Cache-Control"
  # Expected: HTTP/2 200, Cache-Control: public
  ```

---

### 💾 Backup

- [ ] **23. Backup script runs without errors**
  ```bash
  PG_USER=malaika_user PG_DB=malaika_production \
    bash /var/www/malaikanest/deployment/backup.sh
  ls -lh /var/backups/malaikanest/
  # Expected: db-*.sql.gz and sha256 files present
  ```

- [ ] **24. Backup cron is registered**
  ```bash
  crontab -l -u www-data | grep backup.sh
  # Expected: the daily 02:00 cron line
  ```

---

### 📊 Logging

- [ ] **25. JSON production log is being written**
  ```bash
  tail -5 /var/log/malaikanest/production.json.log | python3 -c "
  import sys, json
  for line in sys.stdin:
      d = json.loads(line)
      print(d['level'], d['logger'], d['msg'][:60])
  "
  ```

- [ ] **26. Nginx access log shows real client IPs (not 127.0.0.1)**
  ```bash
  tail -5 /var/log/nginx/malaikanest-access.log
  # IPs should be real client IPs, not the Gunicorn loopback
  ```

---

### 🌐 Frontend

- [ ] **27. Homepage loads and returns products**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" https://malaikanest.duckdns.org/
  # Expected: 200
  ```

- [ ] **28. Next.js build is production build (not dev server)**
  ```bash
  systemctl status frontend | grep -E "ExecStart|Active"
  # Should show: npm start  (not npm run dev)
  ```

---

> ✅ **Sign-off**: All 28 items verified by __________ on __________ (date)
