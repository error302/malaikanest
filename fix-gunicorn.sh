#!/bin/bash
# Fix Gunicorn socket permission issues

echo "🔧 Fixing Gunicorn socket..."

# Stop gunicorn service
echo "🛑 Stopping gunicorn..."
sudo systemctl stop malaika-gunicorn 2>/dev/null || true

# Remove old socket
echo "🗑️ Removing old socket..."
sudo rm -f /run/gunicorn.sock
sudo rm -f /home/mohameddosho20/malaikanest/gunicorn.sock

# Create new socket directory
echo "📁 Creating socket directory..."
sudo mkdir -p /home/mohameddosho20/malaikanest

# Create socket file
echo "🔨 Creating socket file..."
sudo touch /home/mohameddosho20/malaikanest/gunicorn.sock
sudo chmod 775 /home/mohameddosho20/malaikanest/gunicorn.sock
sudo chown mohameddosho20:mohameddosho20 /home/mohameddosho20/malaikanest/gunicorn.sock

# Reload systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# Start gunicorn
echo "▶️ Starting gunicorn..."
sudo systemctl start malaika-gunicorn

# Check status
echo "📊 Checking status..."
sudo systemctl status malaika-gunicorn --no-pager || pm2 status gunicorn

echo "✅ Gunicorn fix complete!"

