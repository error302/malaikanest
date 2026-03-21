#!/usr/bin/env bash
# Malaika Nest Production Deploy Script
# Run after: git pull origin main
# Usage: bash deploy.sh
set -euo pipefail

APP_DIR="/var/www/malaikanest"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
VENV="$APP_DIR/venv"

# Colours
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $*"; }
die()  { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

# ── Safety checks ─────────────────────────────────────────────────────────────
[[ -d "$BACKEND_DIR" ]] || die "Backend directory not found: $BACKEND_DIR"
[[ -d "$VENV" ]] || die "Virtualenv not found: $VENV. Run: python3 -m venv $VENV && $VENV/bin/pip install -r $BACKEND_DIR/requirements.txt"
[[ -f "$BACKEND_DIR/.env.production" ]] || die "Missing $BACKEND_DIR/.env.production"

PYTHON="$VENV/bin/python"
PIP="$VENV/bin/pip"

# ── Backend ───────────────────────────────────────────────────────────────────
log "Installing Python dependencies..."
"$PIP" install --quiet -r "$BACKEND_DIR/requirements.txt"

log "Running database migrations..."
DJANGO_SETTINGS_MODULE=config.settings.prod "$PYTHON" "$BACKEND_DIR/manage.py" migrate --noinput

log "Collecting static files..."
DJANGO_SETTINGS_MODULE=config.settings.prod "$PYTHON" "$BACKEND_DIR/manage.py" collectstatic --noinput --clear

log "Running deployment check..."
DJANGO_SETTINGS_MODULE=config.settings.prod "$PYTHON" "$BACKEND_DIR/manage.py" check --deploy || warn "Deployment check raised warnings (review above)"

# ── Frontend ──────────────────────────────────────────────────────────────────
if [[ -d "$FRONTEND_DIR" ]]; then
    log "Installing frontend dependencies..."
    npm --prefix "$FRONTEND_DIR" ci --prefer-offline

    log "Building Next.js frontend..."
    npm --prefix "$FRONTEND_DIR" run build

    log "Clearing npm cache to save disk space..."
    npm --prefix "$FRONTEND_DIR" cache clean --force 2>/dev/null || true
fi

# ── Services ─────────────────────────────────────────────────────────────────
log "Restarting backend services..."
sudo systemctl restart gunicorn celery celerybeat

log "Testing nginx config..."
sudo nginx -t

log "Reloading nginx..."
sudo systemctl reload nginx

log "Checking service status..."
sudo systemctl is-active --quiet gunicorn && log "gunicorn:    running ✓" || warn "gunicorn:    FAILED ✗"
sudo systemctl is-active --quiet celery    && log "celery:      running ✓" || warn "celery:      FAILED ✗"
sudo systemctl is-active --quiet celerybeat && log "celerybeat:  running ✓" || warn "celerybeat:  FAILED ✗"
sudo systemctl is-active --quiet nginx     && log "nginx:       running ✓" || warn "nginx:       FAILED ✗"

echo ""
echo "========================================"
echo -e "${GREEN}Deployment complete!${NC}"
echo "========================================"
echo "Frontend: https://malaikanest.duckdns.org"
echo "Health:   https://malaikanest.duckdns.org/api/health/"
echo "Admin:    https://malaikanest.duckdns.org/manage-store/"
