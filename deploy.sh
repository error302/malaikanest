#!/bin/bash

# ============================================
# MALAIKA NEST - AUTOMATIC DEPLOYMENT SCRIPT
# ============================================

set -e

echo "========================================"
echo "🚀 Starting Malaika Nest Deployment"
echo "========================================"

# Navigate to project directory
PROJECT_DIR="/home/mohameddosho20/malaikanest"
cd "$PROJECT_DIR"

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Frontend deployment
echo "📦 Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm install

echo "🔨 Building frontend..."
npm run build

# Stop old frontend process
echo "🛑 Stopping old frontend..."
pkill -f "next-server" || true
pkill -f "npm start" || true
sleep 1

# Start new frontend
echo "▶️ Starting frontend..."
cd "$PROJECT_DIR/frontend"
nohup npm start > /tmp/frontend.log 2>&1 &

# Backend deployment
echo "🐍 Setting up backend..."
cd "$PROJECT_DIR/backend"

# Activate virtual environment
source "$PROJECT_DIR/venv/bin/activate"

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput -q 2>/dev/null || true

# Restart backend
echo "🛑 Restarting backend..."
sudo systemctl restart malaika-gunicorn

echo "========================================"
echo "✅ Deployment completed successfully!"
echo "========================================"

# Wait for services to start
sleep 5

# Verify services
echo "🔍 Verifying services..."
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "⚠️ Frontend may not be running properly"
    echo "Check log: tail /tmp/frontend.log"
fi

if curl -sf http://127.0.0.1:8000/api/health/ > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️ Backend may not be running properly"
    echo "Check: sudo systemctl status malaika-gunicorn"
fi

echo ""
echo "🌐 Website should be live at: https://malaikanest.duckdns.org"
