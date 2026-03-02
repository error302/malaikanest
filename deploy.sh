#!/bin/bash

# Production Deployment Script for Malaika Nest
# Run this script on your Google Cloud VM

set -e

echo "🚀 Starting Malaika Nest deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}Error: This script must be run from the malaika nest directory${NC}"
    exit 1
fi

# Pull latest code from git
echo -e "${YELLOW}📥 Pulling latest code from git...${NC}"
git pull origin main

# Install and build frontend
echo -e "${YELLOW}🏗 Building frontend...${NC}"
cd "$SCRIPT_DIR/frontend"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Warning: .env.production not found in frontend directory${NC}"
    echo "Creating from template..."
    cp .env.example .env.production 2>/dev/null || true
fi

npm install
npm run build

# Restart frontend with PM2
echo -e "${YELLOW}🔄 Restarting frontend...${NC}"
pm2 restart frontend || pm2 start npm --name frontend -- start

# Install and restart backend
echo -e "${YELLOW}🐍 Setting up backend...${NC}"
cd "$SCRIPT_DIR/backend"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Warning: .env not found in backend directory${NC}"
    echo "Creating from template..."
    cp .env.example .env 2>/dev/null || true
fi

# Install Python dependencies if needed
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi

# Run migrations
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
python manage.py migrate --noinput

# Collect static files
echo -e "${YELLOW}📁 Collecting static files...${NC}"
python manage.py collectstatic --noinput

# Restart backend with PM2
echo -e "${YELLOW}🔄 Restarting backend...${NC}"
pm2 restart backend || pm2 start gunicorn --name backend -- kenya_ecom.wsgi:application --bind 0.0.0.0:8000 --workers 4

# Save PM2 configuration
pm2 save

# Show status
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Frontend status:"
pm2 status | grep frontend
echo ""
echo "Backend status:"
pm2 status | grep backend
echo ""
echo -e "${GREEN}🌐 Your site should now be live!${NC}"
