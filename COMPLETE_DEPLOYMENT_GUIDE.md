# Kenya Baby E-Commerce - Production Deployment Guide

This guide provides step-by-step instructions for deploying the Kenya Baby E-Commerce platform on a fresh Ubuntu 22.04 VPS.

## Prerequisites

- Ubuntu 22.04 VPS with root access
- Domain name pointing to your server's IP
- Basic knowledge of Linux command line

---

## Table of Contents

1. [Server Preparation](#1-server-preparation)
2. [Domain & SSL Setup](#2-domain--ssl-setup)
3. [Docker Installation](#3-docker-installation)
4. [Project Deployment](#4-project-deployment)
5. [M-Pesa Configuration](#5-m-pesa-configuration)
6. [Post-Deployment Tasks](#6-post-deployment-tasks)
7. [Monitoring & Maintenance](#7-monitoring--maintenance)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Server Preparation

### 1.1 Initial Server Setup

```bash
# Connect to your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Create deployment user
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
mkdir -p /opt/kenya_baby_ecommerce
chown -R deploy:deploy /opt/kenya_baby_ecommerce
```

### 1.2 Install Required Packages

```bash
# Install system dependencies
apt install -y curl wget git nginx postgresql postgresql-contrib redis-server \
    fail2ban ufw certbot python3-certbot-nginx python3-pip

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE USER kenya_user WITH PASSWORD 'your_strong_password_here';"
sudo -u postgres psql -c "CREATE DATABASE kenya_ecom OWNER kenya_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kenya_ecom TO kenya_user;"

# Start and enable services
systemctl enable postgresql redis-server
systemctl start postgresql redis-server
```

### 1.3 Configure Firewall

```bash
# Configure UFW
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable
```

---

## 2. Domain & SSL Setup

### 2.1 Point Domain to Server

Configure your domain's DNS records:
- A Record: `@` → `your-server-ip`
- A Record: `www` → `your-server-ip`

### 2.2 Obtain SSL Certificate

```bash
# Stop nginx temporarily
systemctl stop nginx

# Obtain certificate (replace with your domain)
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Create required directories
mkdir -p /var/www/certbot

# Setup auto-renewal
echo "0 0 * * * certbot renew --quiet" | crontab -
```

---

## 3. Docker Installation

### 3.1 Install Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
usermod -aG docker deploy
```

### 3.2 Install Docker Compose

```bash
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

---

## 4. Project Deployment

### 4.1 Upload Project Files

```bash
# As deploy user, clone or upload project
cd /opt/kenya_baby_ecommerce
# Upload your project files here

# Or clone from git
git clone <your-repo-url> .
chown -R deploy:deploy /opt/kenya_baby_ecommerce
```

### 4.2 Configure Environment

```bash
# Copy and configure environment file
cp .env.production.example .env.production
nano .env.production
```

Fill in all required values in `.env.production`:
- `SECRET_KEY`: Generate a strong random key
- `DB_PASSWORD`: Your PostgreSQL password
- `SIMPLE_JWT_SECRET`: Another strong random key
- `MPESA_*`: Your Safaricom Daraja credentials
- `EMAIL_*`: Your SMTP configuration
- `ALLOWED_HOSTS`: Your domain

### 4.3 Build and Start Services

```bash
# As deploy user
cd /opt/kenya_baby_ecommerce

# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4.4 Verify Services

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Test API endpoint
curl https://yourdomain.com/api/products/products/
```

---

## 5. M-Pesa Configuration

### 5.1 Obtain Production Credentials

1. Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an app and get production credentials:
   - Consumer Key
   - Consumer Secret
3. Get your Business Short Code from Safaricom
4. Generate Passkey from the portal

### 5.2 Configure M-Pesa Callback

Your callback URL must be publicly accessible. Ensure:
- SSL certificate is valid
- Firewall allows incoming traffic on port 443
- URL is added to your Daraja app settings

### 5.3 Test M-Pesa Integration

```bash
# Test STK Push endpoint (using curl)
curl -X POST https://yourdomain.com/api/payments/mpesa/stk/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-test-token>" \
  -d '{"order_id": 1, "phone": "2547XXXXXXXX"}'
```

---

## 6. Post-Deployment Tasks

### 6.1 Create Admin User

```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 6.2 Collect Static Files

```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### 6.3 Run Migrations (if needed)

```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### 6.4 Configure Nginx

```bash
# Copy nginx config
cp deployment/nginx.prod.conf /etc/nginx/sites-available/kenya_baby_ecommerce
ln -s /etc/nginx/sites-available/kenya_baby_ecommerce /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 6.5 Setup Backup

```bash
# Make backup script executable
chmod +x deployment/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/kenya_baby_ecommerce/deployment/backup.sh
```

---

## 7. Monitoring & Maintenance

### 7.1 Log Management

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f backend

# View nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 7.2 Service Management

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Stop all services
docker-compose -f docker-compose.prod.yml down
```

### 7.3 Database Backup

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U kenya_user kenya_ecom > backup.sql
```

### 7.4 SSL Certificate Renewal

```bash
# Manual renewal
certbot renew --nginx

# Test auto-renewal
certbot renew --dry-run
```

---

## 8. Troubleshooting

### 8.1 Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service_name

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Port already in use
```

### 8.2 M-Pesa Not Working

1. Verify credentials in `.env.production`
2. Check callback URL is accessible
3. Review payment logs: `docker-compose logs payment`
4. Ensure SSL certificate is valid

### 8.3 Database Connection Issues

```bash
# Check PostgreSQL
docker-compose -f docker-compose.prod.yml exec db psql -U kenya_user -d kenya_ecom

# Test connection
docker-compose -f docker-compose.prod.yml exec backend python manage.py dbshell
```

### 8.4 High Memory Usage

```bash
# Check container resource usage
docker stats

# Reduce Gunicorn workers in docker-compose.prod.yml
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable UFW firewall
- [ ] Configure Fail2ban
- [ ] Use strong SECRET_KEY values
- [ ] Enable SSL/HTTPS
- [ ] Configure proper CORS origins
- [ ] Protect admin URL
- [ ] Regular backups
- [ ] Monitor logs regularly

---

## Quick Commands Reference

```bash
# Deploy/Update
cd /opt/kenya_baby_ecommerce
git pull
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Database shell
docker-compose -f docker-compose.prod.yml exec backend python manage.py dbshell

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

---

## Support

For issues, check:
1. Docker logs: `docker-compose logs`
2. Nginx error logs: `/var/log/nginx/error.log`
3. Application logs: `/opt/kenya_baby_ecommerce/backend/logs/`

---

Last Updated: February 2026
