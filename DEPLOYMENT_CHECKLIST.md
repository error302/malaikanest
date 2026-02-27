# Malaika Nest - Deployment Checklist

## What I Fixed (Automated ✅):
- [x] Docker Compose configuration (database healthcheck)
- [x] Nginx configuration (domain variable)
- [x] Environment variables template
- [x] Django settings (ADMIN_URL_SECRET)
- [x] Quick deploy script created

---

## What YOU Need To Do:

### Step 1: Get M-Pesa Credentials (Required for Payments)
1. Go to https://developer.safaricom.co.ke/
2. Register/Login
3. Create an app to get:
   - Consumer Key
   - Consumer Secret
4. Get Passkey from your Daraja dashboard

### Step 2: Get Cloudinary (Required for Images)
1. Go to https://cloudinary.com/
2. Sign up for free
3. Get your:
   - Cloud Name
   - API Key
   - API Secret

### Step 3: Deploy to Server

#### Option A: Quick Deploy (Run on server)
```
bash
# Upload project to server, then:
sudo chmod +x quick-deploy.sh
sudo DOMAIN=yourdomain.com POSTGRES_PASSWORD=your-db-pass \
  MPESA_CONSUMER_KEY=your-key \
  MPESA_CONSUMER_SECRET=your-secret \
  MPESA_PASSKEY=your-passkey \
  CLOUDINARY_NAME=your-cloud \
  CLOUDINARY_KEY=your-key \
  CLOUDINARY_SECRET=your-secret \
./quick-deploy.sh
```

#### Option B: Manual Docker
```
bash
# 1. Copy env file
cp .env.production.example .env.production
nano .env.production  # Fill in all values

# 2. Start services
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Create admin
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### Step 4: Get SSL Certificate
```
bash
# After domain DNS points to server:
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

### Step 5: Configure M-Pesa Callback
1. In Safaricom Daraja dashboard, set callback URL to:
   `https://yourdomain.com/api/payments/mpesa/callback/`

---

## Quick Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart
docker-compose -f docker-compose.prod.yml restart

# Stop
docker-compose -f docker-compose.prod.yml down
```

---

## Admin Access
- URL: `https://yourdomain.com/admin`
- Username: admin@yourdomain.com
- Password: admin123 (change after first login!)
