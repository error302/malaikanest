#!/bin/bash
set -e

echo "========================================"
echo "Starting Malaika Nest Deployment"
echo "========================================"

# Navigate to project directory
cd ~/malaikanest || exit 1

# Pull latest code from GitHub
echo "Pulling latest code from GitHub..."
git pull origin main

# Create .env file if it doesn't exist
echo "Setting up environment variables..."
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env (placeholders only; fill with real values on the server)..."
    cat > backend/.env << 'EOF'
# Django Settings
SECRET_KEY=CHANGE_ME
DEBUG=False
ALLOWED_HOSTS=104.154.161.10,malaikanest.duckdns.org,www.malaikanest.duckdns.org

# Database (PostgreSQL on the VM)
DATABASE_URL=postgresql://malaika_user:CHANGE_ME@localhost:5432/malaika_db


# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Malaika Nest <noreply@malaikanest.local>

# M-Pesa Payment Settings (update with your credentials)
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=your-shortcode
MPESA_PASSKEY=your-passkey

# CORS
CORS_ALLOWED_ORIGINS=https://malaikanest.duckdns.org,https://www.malaikanest.duckdns.org,http://localhost:3000
EOF
    echo "backend/.env created (placeholders)."
fi

# Install frontend dependencies and build
echo "Installing frontend dependencies..."
cd ~/malaikanest/frontend
npm install

echo "Building frontend..."
npm run build

# Clean up npm cache to save disk space and prevent ENOSPC errors
echo "Cleaning up npm cache..."
npm cache clean --force || true

# Stop and restart frontend - delete first to avoid port conflicts
echo "Check/Stop frontend..."
pm2 delete frontend 2>/dev/null || true
# Kill old node processes on port 3000 since lsof is missing on the VM
fuser -k 3000/tcp 2>/dev/null || killall node 2>/dev/null || true
sleep 2

echo "Starting frontend..."
pm2 start ecosystem.config.js || pm2 restart frontend

# Setup backend
echo "Setting up backend..."
cd ~/malaikanest/backend

# Check for virtual environment and set PYTHON_CMD
PYTHON_CMD="python3"
GUNICORN_CMD="gunicorn"
VENV_ACTIVATED=false

if [ -d "../.venv" ]; then
    echo "✅ Using .venv"
    source ../.venv/bin/activate
    PYTHON_CMD="../.venv/bin/python"
    GUNICORN_CMD="../.venv/bin/gunicorn"
    VENV_ACTIVATED=true
elif [ -d "venv" ]; then
    echo "✅ Using venv"
    source venv/bin/activate
    PYTHON_CMD="venv/bin/python"
    GUNICORN_CMD="venv/bin/gunicorn"
    VENV_ACTIVATED=true
elif [ -d ".venv" ]; then
    echo "✅ Using .venv"
    source .venv/bin/activate
    PYTHON_CMD=".venv/bin/python"
    GUNICORN_CMD=".venv/bin/gunicorn"
    VENV_ACTIVATED=true
else
    echo "⚠️ Virtual environment not found, using system Python"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt || echo "⚠️ pip install failed, continuing..."

# Run migrations
echo "Running database migrations..."
$PYTHON_CMD manage.py migrate --noinput || echo "⚠️ Migration failed, continuing..."

# Collect static files
echo "Collecting static files..."
$PYTHON_CMD manage.py collectstatic --noinput || echo "⚠️ Collectstatic failed, continuing..."

# Restart backend using PM2
echo "Restarting backend with PM2..."

# Delete existing backend process and restart cleanly
pm2 delete backend 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || killall gunicorn 2>/dev/null || true
sleep 2

# Use ecosystem.config.js for proper backend startup with venv
pm2 start ./ecosystem.config.js || pm2 restart backend

# Save PM2 state for automatic restart on reboot
pm2 save 2>/dev/null || true

# Also try systemd as fallback
sudo systemctl restart malaika-gunicorn 2>/dev/null || echo "⚠️ Systemd not available, using PM2 only"

echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "⚠️ IMPORTANT: Please run this command to expose the logs:"
echo "sudo cp ~/malaikanest/malaikanest-nginx.conf /etc/nginx/sites-available/malaikanest && sudo systemctl reload nginx"
echo ""
