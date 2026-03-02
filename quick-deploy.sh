#!/bin/bash

# Quick Deploy Script for Malaika Nest
# Usage: ./quick-deploy.sh

set -e

echo "🚀 Quick Deploy for Malaika Nest"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git not found. Please install git.${NC}"
    exit 1
fi

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main 2>/dev/null || echo "Not a git repo or no remote, skipping git pull"

# ====================
# BACKEND SETUP
# ====================
echo -e "${YELLOW}🐍 Setting up backend...${NC}"
cd "$PROJECT_DIR/backend"

# Check if virtualenv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet
fi

# Run migrations
python manage.py migrate --noinput 2>/dev/null || true

# Collect static files
python manage.py collectstatic --noinput 2>/dev/null || true

# ====================
# FRONTEND SETUP
# ====================
echo -e "${YELLOW}🏗 Building frontend...${NC}"
cd "$PROJECT_DIR/frontend"

# Install dependencies
npm install --silent 2>/dev/null || npm install

# Build
npm run build

# ====================
# RESTART SERVICES
# ====================
echo -e "${YELLOW}🔄 Restarting services...${NC}"

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    # Restart backend
    pm2 restart backend 2>/dev/null || \
    pm2 start gunicorn --name backend -- kenya_ecom.wsgi:application --bind 0.0.0.0:8000 --workers 2

    # Restart frontend
    pm2 restart frontend 2>/dev/null || \
    pm2 start npm --name frontend -- start

    # Save PM2 state
    pm2 save 2>/dev/null || true

    echo -e "${GREEN}✅ Services restarted!${NC}"
    pm2 status
else
    echo -e "${YELLOW}⚠️ PM2 not found. Please start services manually:${NC}"
    echo "  Backend: cd $PROJECT_DIR/backend && source venv/bin/activate && gunicorn kenya_ecom.wsgi:application --bind 0.0.0.0:8000"
    echo "  Frontend: cd $PROJECT_DIR/frontend && npm start"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo "Your site should be live at http://104.154.161.10"
