#!/bin/bash

# Fix gunicorn socket permission issue

echo "Fixing gunicorn socket permissions..."

# Stop gunicorn
sudo systemctl stop malaika-gunicorn

# Remove old socket
sudo rm -f /home/mohameddosho20/malaikanest/gunicorn.sock

# Recreate with proper permissions
sudo touch /home/mohameddosho20/malaikanest/gunicorn.sock
sudo chmod 775 /home/mohameddosho20/malaikanest/gunicorn.sock
sudo chown mohameddosho20:mohameddosho20 /home/mohameddosho20/malaikanest/gunicorn.sock

# Check gunicorn service file
echo "Checking gunicorn service file..."
cat /etc/systemd/system/malaika-gunicorn.service

# Reload systemd
sudo systemctl daemon-reload

# Start gunicorn
sudo systemctl start malaika-gunicorn

# Check status
sudo systemctl status malaika-gunicorn

