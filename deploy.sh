#!/bin/bash
set -e

echo "========================================"
echo "🚀 Starting Malaika Nest Deployment"
echo "========================================"

# Navigate to project directory
cd ~/malaikanest || exit 1

# Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git checkout -- deploy.sh
git pull origin main

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd ~/malaikanest/frontend
npm install

echo "🔨 Building frontend..."
npm run build

# Stop and restart frontend
echo "🛑 Check/Stop frontend..."
pm2 stop frontend 2>/dev/null || true
echo "▶️ Starting frontend..."
pm2 start ecosystem.config.js || pm2 restart frontend

# Setup backend
echo "🐍 Setting up backend..."
cd ~/malaikanest/backend

# Check for virtual environment and set PYTHON_CMD
PYTHON_CMD="python3"
GUNICORN_CMD="gunicorn"

if [ -d "../.venv" ]; then
    echo "✅ Using .venv"
    source ../.venv/bin/activate
    PYTHON_CMD="../.venv/bin/python"
    GUNICORN_CMD="../.venv/bin/gunicorn"
elif [ -d "venv" ]; then
    echo "✅ Using venv"
    source venv/bin/activate
    PYTHON_CMD="venv/bin/python"
    GUNICORN_CMD="venv/bin/gunicorn"
elif [ -d ".venv" ]; then
    echo "✅ Using .venv"
    source .venv/bin/activate
    PYTHON_CMD=".venv/bin/python"
    GUNICORN_CMD=".venv/bin/gunicorn"
else
    echo "⚠️ Virtual environment not found, using system Python"
fi

# Run migrations
echo "🗄️ Running database migrations..."
$PYTHON_CMD manage.py migrate --noinput || echo "⚠️ Migration failed, continuing..."

# Collect static files
echo "📁 Collecting static files..."
$PYTHON_CMD manage.py collectstatic --noinput || echo "⚠️ Collectstatic failed, continuing..."

# Restart backend using PM2
echo "🔄 Restarting backend with PM2..."

# Try to restart existing PM2 backend process, or start new one
pm2 restart backend 2>/dev/null || \
pm2 start "$GUNICORN_CMD --name backend --bind 0.0.0.0:8000 --workers 2 kenya_ecom.wsgi:application"

# Save PM2 state for automatic restart on reboot
pm2 save 2>/dev/null || true

# Also try systemd as fallback
sudo systemctl restart malaika-gunicorn 2>/dev/null || echo "⚠️ Systemd not available, using PM2 only"

echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"

