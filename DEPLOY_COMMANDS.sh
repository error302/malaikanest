#!/bin/bash

# ============================================
# MALAIKA NEST - DEPLOYMENT COMMANDS
# ============================================

echo "=== Malaika Nest Deployment ==="

# Navigate to backend
cd ~/malaikanest/backend

# Activate virtual environment
source venv/bin/activate

# Set environment variables
export SECRET_KEY='f@$zl+8_nwk7&#w^xgi0+ims&88q0ho1(!eegmssk3q2@(@x7sc'
export DEBUG=False
export ALLOWED_HOSTS='malaikanest.duckdns.org,www.malaikanest.duckdns.org,localhost,127.0.0.1'
export DATABASE_URL='postgresql://malaika_user:Dosho10701$@localhost:5432/malaika_db'
export FRONTEND_URL='https://malaikanest.duckdns.org'
export CORS_ALLOWED_ORIGINS='https://malaikanest.duckdns.org,http://localhost:3000'
export CSRF_TRUSTED_ORIGINS='https://malaikanest.duckdns.org'
export REDIS_URL='redis://localhost:6379/0'
export JWT_SIGNING_KEY='f@$zl+8_nwk7&#w^xgi0+ims&88q0ho1(!eegmssk3q2@(@x7sc'

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Collect static files (if needed)
python manage.py collectstatic --noinput

# Restart backend service
echo "Restarting Gunicorn..."
sudo systemctl restart gunicorn

# Or if using PM2:
# pm2 restart backend

echo "=== Deployment Complete ==="
echo "Backend should be running at: https://malaikanest.duckdns.org"

