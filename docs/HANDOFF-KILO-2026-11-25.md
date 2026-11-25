# Kilo Handoff — Malaika Nest Production (Oracle VM)

> **Read this before touching production.** Several assumptions in the repo docs
> do NOT match what actually runs on the Oracle VM. This document reflects the
> verified live state as of **2026-11-25**.

---

## 1. How to reach the VM

```bash
ssh malaikanest-oracle          # alias defined in ~/.ssh/config
# = ubuntu@84.12.96.105 with key ~/.ssh/oracle-metardu.key
```

App directory: `/home/ubuntu/malaikanest` (git checkout of `error302/malaikanest`, branch `main`).

## 2. ⚠️ The real production stack is `docker-compose.lean.yml` — NOT `docker-compose.yml`

This is the #1 thing to get right.

| | Reality on the VM |
|---|---|
| Compose file in use | `docker-compose.lean.yml` |
| Services | `web` (Django/gunicorn), `db` (postgres 15), `cloudflared` |
| NOT running | `backend`, `frontend`, `redis`, `celery_*`, `backend_replica`, `cloudflared_standby` |
| RAM on VM | **956 MB total** — do NOT start the full compose stack here, it will OOM |

Consequences:

- Commands like `docker compose exec backend …` or `docker compose exec web python manage.py …`
  from docs/AGENTS.md are written for the full stack. On the VM the service is **`web`** and you
  must pass the file: `docker compose -f docker-compose.lean.yml exec web …`
- The site is **Django server-rendered templates** (`backend/templates/storefront/*.html`),
  not the Next.js app. The Next.js frontend container is not part of production.
- `cloudflared` routes ALL hostnames (`malaikanest.com`, `www.`, `api.`) to `http://web:8000`.

## 3. Deploys: runner IS installed (as of 2026-11-25) — push to main = auto-deploy

A GitHub Actions self-hosted runner now runs on the Oracle VM:

- Service: `actions.runner.error302-malaikanest.malaikanest-vm` (systemd, `~/actions-runner`)
- Labels: `self-hosted, malaikanest` · runner v2.338.2 (auto-updates)
- **Pushing to `main` deploys automatically** via `.github/workflows/deploy.yml`, which is
  lean-stack-aware: it pulls, re-applies the cloudflared pin (§4), tags a rollback image
  (`malaikanest-web:before-deploy-<ts>`), runs `docker compose -f docker-compose.lean.yml
  build web && up -d web`, and gates on the container healthcheck. Verified end-to-end
  (run 45608813050, success in 2m6s).
- Registration tokens expire in ~1h; to re-register:
  `gh api -X POST repos/error302/malaikanest/actions/runners/registration-token --jq .token`
  then `GH_TOKEN=<token> bash deployment/setup-gh-runner.sh` on the VM.
- The runner idles at ~100–150 MB — the 4 GB swapfile on the VM absorbs build spikes.
  **Keep the VM's swap.** Don't run memory-heavy jobs on this runner.
- Manual deploy still works (and is the fallback if the runner is down):

```bash
ssh malaikanest-oracle
cd ~/malaikanest
git pull --ff-only origin main
docker tag malaikanest-web:latest malaikanest-web:before-<change>-$(date +%Y%m%d)
docker compose -f docker-compose.lean.yml build web
docker compose -f docker-compose.lean.yml up -d web
docker compose -f docker-compose.lean.yml ps   # wait for healthy
```

`scripts/ops/deploy-to-vm.{sh,ps1}` target the *old GCP VM* (stopped) — not for Oracle.

**The actual deploy procedure (manual, proven 2026-11-25):**

```bash
ssh malaikanest-oracle
cd ~/malaikanest
git pull --ff-only origin main

# 1. rollback point first (existing convention on this VM)
docker tag malaikanest-web:latest malaikanest-web:before-<change>-$(date +%Y%m%d)

# 2. rebuild + restart ONLY the web service
docker compose -f docker-compose.lean.yml build web
docker compose -f docker-compose.lean.yml up -d web

# 3. wait for health (healthcheck has 90s start_period)
docker compose -f docker-compose.lean.yml ps
```

Migrations + `collectstatic` run **automatically** inside the container on every start
(`/code/deploy/start-web.sh`: `migrate --noinput`, `collectstatic --noinput`, then gunicorn).
You never need to run `manage.py migrate` by hand on this VM — restarting `web` does it.

Downtime: recreating `web` = a few seconds of 502s (it's the only upstream). Do it off-peak.

## 4. ⚠️ `cloudflared/config.yml` is deliberately pinned to `web:8000` on the VM

Commit `9da36ddd` repointed the repo's `cloudflared/config.yml` ingress to `http://backend:8000`
(correct for the *full* compose stack, whose backend service is named `backend`). The lean
stack's service is named `web`, so on the VM this file is kept at the **old** version
(working tree shows ` M cloudflared/config.yml` — that is intentional, not an accident).

- The running `cloudflared` container binds `~/malaikanest/cloudflared/` into the container and
  reads the file **at startup**. If the file says `backend:8000` and cloudflared ever restarts
  (VM reboot, `docker compose restart`), the whole site 502s.
- The deploy workflow re-applies the pin automatically after every pull
  (`sed backend:8000 → web:8000`), so this stays safe across auto-deploys. Still: **do not**
  hand-edit the repo copy expecting it to survive, and **do not** remove the sed line from
  `deploy.yml`.
- Proper long-term fix (needs a decision): template the service name per stack, or have
  `docker-compose.lean.yml` override the ingress file.

## 5. Env & secrets on the VM

- Live env file: `~/malaikanest/backend/.env` (mounted via `env_file`). Never commit it; never
  print its values in logs/handoffs.
- `ADMIN_AUTHORIZED_EMAILS` **must include every `is_staff` user** — see §6.
- New in the hardening commits: `ADMIN_URL_PREFIX` (already set), `VALID_REDIRECT_HOSTS`
  (hardcoded sensible default in `base.py`, no env needed).
- Reminder: `NEXT_PUBLIC_*` is build-time inlined (Next.js side only — not used on this VM).

## 6. Admin access & the allowlist (verified 2026-11-25)

Actual staff accounts in the production DB:

| email | superuser |
|---|---|
| `hello@malaikanest.com` | **yes** (the real owner account) |
| `malaikanest7@gmail.com` | no (staff) |

`ADMIN_AUTHORIZED_EMAILS` on the VM is set to:

```
ADMIN_AUTHORIZED_EMAILS=hello@malaikanest.com,malaikanest7@gmail.com
```

Why this matters more than it looks: in `backend/apps/accounts/authentication.py` the
allowlist is enforced inside `CookieJWTAuthentication` / `JWTAuthenticationWithRotation`
for **any** staff user — a staff email missing from the list gets `InvalidToken` on *all*
API requests, not just admin pages. The names `admin@malaikanest.com` / `owner@malaikanest.com`
from earlier notes **do not exist** as users; adding them to the list is harmless but does
nothing. If you create such accounts later, add them here.

- Admin URL: `https://malaikanest.com/manage-store/` (prefix from `ADMIN_URL_PREFIX`; `/admin/` 404s by design).
- TOTP 2FA (django-otp) ships in the new code; its migrations apply on next `web` restart.
  Enroll devices via Django admin after deploy. `OTP_TOTP_THROTTLE_FACTOR=1` → one attempt/30s.
- `hello@malaikanest.com` stays in the allowlist — removing it locks the owner out.

## 7. Verify a deploy actually took effect

```bash
# inside the VM
docker compose -f docker-compose.lean.yml ps          # web: healthy
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: api.malaikanest.com' \
  -H 'X-Forwarded-Proto: https' http://127.0.0.1:8000/api/health/   # 200
docker exec malaikanest-web-1 python manage.py showmigrations accounts | tail -5

# from anywhere
curl -s -o /dev/null -w '%{http_code}\n' https://malaikanest.com/     # 200
curl -s -o /dev/null -w '%{http_code}\n' https://api.malaikanest.com/api/health/  # 200
```

Spot-check code identity: `docker exec malaikanest-web-1 python -c "import config.settings.base as b, pathlib; print(pathlib.Path(b.__file__).read_text()[:1])"` — or simpler,
compare `git rev-parse HEAD` on the VM with the commit whose changes you expect, then confirm
a distinctive string from that commit appears in the built image, e.g.:
`docker exec malaikanest-web-1 grep -c "ADMIN_AUTHORIZED_EMAILS" /code/config/settings/base.py`.

## 8. Rollback (30 seconds)

```bash
cd ~/malaikanest
docker tag malaikanest-web:before-sync-github-20261125 malaikanest-web:latest
docker compose -f docker-compose.lean.yml up -d web
```

Pre-deploy tags exist for every recent change (`before-daraja-20261124`,
`before-staff-access-20261124`, `before-sync-github-20261125`, …). Keep the convention.

## 9. State after the 2026-11-25 sync + runner install

- VM repo: `3412633e` = `origin/main` (kilo's 6 commits + lean deploy.yml fix).
- `web` image rebuilt from that commit via the runner pipeline; healthy; site + API 200 externally.
- `ADMIN_AUTHORIZED_EMAILS` set in `backend/.env` (see §6); TOTP migrations applied.
- Runner: registered, systemd service active, first deploy run succeeded (2m6s).
- Known dirty file on VM: `cloudflared/config.yml` (intentional, auto-maintained by deploy, §4).

## 10. Do NOT do these on the Oracle VM

1. `docker compose up -d` (no `-f` flag) — starts the full 9-service stack → OOM (956 MB RAM).
2. Restart `cloudflared` while `config.yml` points to `backend:8000`.
3. Change `deploy.yml` back to the full stack commands, or remove the cloudflared re-pin sed.
4. Run `scripts/ops/deploy-to-vm.*` — they target the old GCP box.
5. Remove the lucide→Phosphor icon shim or "fix" `docker-compose.lean.yml` service names to match docs.
6. Delete the VM's swapfile — builds and the runner depend on it.
