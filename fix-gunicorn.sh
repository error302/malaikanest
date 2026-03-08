#!/bin/bash

# Fix gunicorn socket permission issue

echo "Fixing gunicorn socket permissions..."

# Stop gunicorn
sudo systemctl stop malaika-gunicorn

# Remove old socket
sudo rm -f /run/gunicorn.sock

# Recreate with proper permissions
sudo touch /run/gunicorn.sock
sudo chmod 775 /run/gunicorn.sock
sudo chown www-data:www-data /run/gunicorn.sock

# Check gunicorn service file
echo "Checking gunicorn service file..."
cat /etc/systemd/system/malaika-gunicorn.service

# Reload systemd
sudo systemctl daemon-reload

# Start gunicorn
sudo systemctl start malaika-gunicorn

# Check status
sudo systemctl status malaika-gunicorn

