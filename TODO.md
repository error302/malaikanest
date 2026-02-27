# Deployment TODO - Malaika Nest E-Commerce

## Completed Fixes ✅
- [x] Fixed ratelimit import in `backend/kenya_ecom/settings.py`
- [x] Fixed ratelimit import in `backend/apps/payments/views.py`
- [x] Removed duplicate django-ratelimit from requirements.txt
- [x] Fixed middleware for Django 5.x compatibility
- [x] Unified settings - Dockerfile.prod now uses `kenya_ecom.settings`

## Pre-Deployment Tasks ⚠️

### 1. Environment Variables
Create `.env.production` with these required values:
```
# Django
SECRET_KEY=<generate-strong-50-char-key>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kenya_ecom
DB_USER=kenya_user
DB_PASSWORD=<strong-20-char-password>
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
SIMPLE_JWT_SECRET=<strong-50-char-key>
ACCESS_TOKEN_LIFETIME=300
REFRESH_TOKEN_LIFETIME=86400

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com

# M-Pesa (get from Safaricom)
MPESA_CONSUMER_KEY=<your-consumer-key>
MPESA_CONSUMER_SECRET=<your-consumer-secret>
MPESA_SHORTCODE=<your-shortcode>
MPESA_PASSKEY=<your-passkey>
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback/

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=<app-password>
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Malaika Nest <your-email@gmail.com>

# Cloudinary
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

# AI (optional)
OPENAI_API_KEY=<your-openai-key>

# Admin
ADMIN_URL_SECRET=<random-secret-for-admin-url>
```

### 2. Nginx Configuration
Update `deployment/nginx.prod.conf`:
- Replace `yourdomain.com` with your actual domain
- Update SSL certificate paths after running certbot

### 3. Domain & SSL
- Point domain DNS A records to server IP
- Run certbot to obtain SSL certificate:
  
```
bash
  certbot --nginx -d yourdomain.com -d www.yourdomain.com
  
```

### 4. Build & Deploy
```
bash
# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## Post-Deployment Tasks 📋
- [ ] Verify health check endpoint
- [ ] Test user registration
- [ ] Test M-Pesa STK push
- [ ] Test complete order flow
- [ ] Configure backup cron job
- [ ] Monitor logs for errors
