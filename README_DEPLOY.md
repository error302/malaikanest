# Malaika Nest - Production Deployment Guide

This guide will help you set up a production-ready deployment on your Google Cloud VM (104.154.161.10).

## Architecture Overview

```
                    ┌─────────────┐
                    │    Nginx    │
                    │  (Port 80)  │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ Frontend  │  │ Backend  │  │  Static  │
      │ (Next.js) │  │ (Django) │  │  Files   │
      │  :3000    │  │  :8000   │  │          │
      └──────────┘  └──────────┘  └──────────┘
                          │
                          ▼
                   ┌────────────┐
                   │ PostgreSQL  │
                   └────────────┘
```

## Option 1: Manual PM2 Deployment (Recommended for your current setup)

### Step 1: SSH into your VM

```
bash
ssh admin@104.154.161.10
```

### Step 2: Install required packages

```
bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx
```

### Step 3: Clone your repository

```
bash
cd /var/www
sudo git clone https://github.com/error302/malaikanest.git
cd malaikanest
```

### Step 4: Set up directory structure

```
bash
sudo mkdir -p /var/log/malaikanest
sudo chown -R $USER:$USER /var/www/malaikanest
```

### Step 5: Configure Backend

```
bash
cd backend

# Create .env file
cp .env.example .env
nano .env
```

Fill in your `.env` with:

```
SECRET_KEY=your-very-long-secret-key-here
DEBUG=False
ALLOWED_HOSTS=104.154.161.10,localhost

# Database (use SQLite for now, or set up PostgreSQL)
DATABASE_URL=db.sqlite3

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SIMPLE_JWT_SECRET=your-jwt-secret-key
ACCESS_TOKEN_LIFETIME=3600
REFRESH_TOKEN_LIFETIME=86400

# CORS - IMPORTANT for frontend to connect
CORS_ALLOWED_ORIGINS=http://104.154.161.10:3000,http://localhost:3000

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL-email@gmail.com
_HOST_USER=yourEMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True

# Cloudinary (optional)
CLOUDINARY_URL=your-cloudinary-url

# Set this to create superuser
CREATE_SUPERUSER=false
```

### Step 6: Set up Python environment and install dependencies

```
bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser (optional)
python manage.py createsuperuser
```

### Step 7: Configure Frontend

```
bash
cd ../frontend

# Create .env.production file
cp .env.local .env.production  # or create new
nano .env.production
```

Set:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 8: Build the frontend

```
bash
npm install
npm run build
```

### Step 9: Configure Nginx

```
bash
sudo cp /var/www/malaikanest/deployment/nginx-production.conf /etc/nginx/sites-available/malaikanest
sudo ln -s /etc/nginx/sites-available/malaikanest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 10: Start services with PM2

```
bash
# Start backend
cd /var/www/malaikanest/backend
pm2 start gunicorn --name backend -- kenya_ecom.wsgi:application --bind 0.0.0.0:8000 --workers 2

# Start frontend
cd /var/www/malaikanest/frontend
pm2 start npm --name frontend -- start

# Save PM2 config
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### Step 11: Verify everything is working

```
bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs backend
pm2 logs frontend
```

Your site should now be live at `http://104.154.161.10`

---

## Option 2: Docker Compose Deployment (Cleaner, Recommended)

### Step 1: Install Docker on VM

```
bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker
```

### Step 2: Clone and configure

```
bash
cd /var/www
git clone https://github.com/error302/malaikanest.git
cd malaikanest
```

### Step 3: Configure environment

```
bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env

# Set a strong password for PostgreSQL
# POSTGRES_PASSWORD=your-secure-password
```

### Step 4: Deploy

```
bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Testing Your Deployment

1. **Test Login Page**: Visit `http://104.154.161.10/login`
2. **Test Registration**: Visit `http://104.154.161.10/register`
3. **Test API**: Visit `http://104.154.161.10:8000/api/products/`
4. **Test Admin**: Visit `http://104.154.161.10/admin`

## Troubleshooting

### Frontend shows "API not configured"

- Check that `NEXT_PUBLIC_API_URL` is set correctly in frontend/.env.production
- Rebuild frontend after changing: `npm run build`
- Restart PM2: `pm2 restart frontend`

### Login/Register not working

- Check backend is running: `pm2 status`
- Check CORS settings in backend/.env
- Check browser console for errors
- Check backend logs: `pm2 logs backend`

### Can't connect to backend

- Verify backend is running on port 8000: `netstat -tlnp | grep 8000`
- Check firewall: `sudo ufw allow 8000`

### Database issues

- Check SQLite file exists: `ls -la backend/db.sqlite3`
- Or check PostgreSQL if using it

## Quick Commands for Managing Deployment

```
bash
# Restart everything
pm2 restart all

# View logs
pm2 logs --lines 50

# Monitor resources
pm2 monit

# Update and redeploy
cd /var/www/malaikanest
git pull origin main
pm2 restart all

# Backup database
cp backend/db.sqlite3 backup_$(date +%Y%m%d).sqlite3
```

---

## Files Created for Deployment

- `deploy.sh` - Main deployment script
- `frontend/ecosystem.config.js` - PM2 config for frontend
- `backend/ecosystem.config.js` - PM2 config for backend
- `deployment/nginx-production.conf` - Nginx reverse proxy config
- `docker-compose.prod.yml` - Docker deployment (alternative)
- `frontend/.env.production.example` - Frontend env template
- `backend/.env.example` - Backend env template
