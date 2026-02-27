# Production Readiness Checklist

## Pre-Deployment Checklist

- [x] Code complete and tested
- [x] Docker Compose production config ready
- [x] Nginx configuration prepared
- [x] Celery tasks configured
- [x] Backup script ready
- [x] Deployment guide complete

## Deployment Checklist

- [ ] Populate `.env.production` from `.env.production.example` with strong secrets
- [ ] Obtain M-Pesa production credentials from Safaricom
- [ ] Configure domain DNS to point to server
- [ ] Run `docker-compose -f docker-compose.prod.yml up -d --build`

## Post-Deployment Checklist

- [ ] Create admin user: `docker-compose exec backend python manage.py createsuperuser`
- [ ] Verify SSL certificate is working
- [ ] Test M-Pesa STK push end-to-end
- [ ] Test user registration and login
- [ ] Test order creation and checkout flow
- [ ] Configure backup cron job
- [ ] Monitor logs for errors

## Security Checklist

- [ ] SECRET_KEY is unique and strong (50+ characters)
- [ ] SIMPLE_JWT_SECRET is unique and strong
- [ ] DB_PASSWORD is strong (20+ characters)
- [ ] ADMIN_URL_SECRET is changed from default
- [ ] UFW firewall enabled
- [ ] SSL/HTTPS enforced
- [ ] CORS origins configured correctly

## M-Pesa Checklist

- [ ] Consumer Key obtained from Safaricom
- [ ] Consumer Secret obtained from Safaricom
- [ ] Business Short Code configured
- [ ] Passkey obtained from Safaricom
- [ ] Callback URL is publicly accessible
- [ ] SSL certificate is valid for callback URL

## Monitoring Checklist

- [ ] Set up log monitoring
- [ ] Configure backup automation
- [ ] Set up health check endpoint
- [ ] Document emergency contacts
