@echo off
cd /d C:\Users\user\Desktop\malaikanest\backend
set DJANGO_SETTINGS_MODULE=config.settings
set DJANGO_ENV=dev
set SECRET_KEY=dev-secret-key-change-in-prod
set SIMPLE_JWT_SECRET=jwt-secret-key-change-in-prod
set DB_NAME=kenya_ecom
set DB_USER=kenya
set DB_PASSWORD=kenya_password
set DB_HOST=localhost
set DB_PORT=5432
python -m gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --threads 4