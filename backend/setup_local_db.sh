#!/bin/bash
# Local Database Setup Script for Malaika Nest
# Run this from the backend directory

echo "============================================"
echo "  Malaika Nest - Local Database Setup"
echo "============================================"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "Starting PostgreSQL..."
    pg_ctl start -D /usr/local/var/postgres 2>/dev/null || \
    sudo systemctl start postgresql 2>/dev/null || \
    echo "Please start PostgreSQL manually"
    exit 1
fi

echo "PostgreSQL is running."

# Create database and user
echo "Creating database and user..."

# Get password for database
echo "Enter a password for the database user (or press Enter to generate one):"
read -s DB_PASSWORD
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_hex(16))")
    echo "Generated password: $DB_PASSWORD"
fi

# Create user and database
sudo -u postgres psql -c "CREATE USER kenya_user WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User may already exist"
sudo -u postgres psql -c "CREATE DATABASE kenya_ecom OWNER kenya_user;" 2>/dev/null || echo "Database may already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kenya_ecom TO kenya_user;" 2>/dev/null

echo "Database created!"

# Create .env file for local development
echo "Creating .env file..."

cd "$(dirname "$0")"

cat > .env << EOF
# Local Development Environment
DEBUG=True
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(50))")
SIMPLE_JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")

# Database - Using local PostgreSQL
DB_NAME=kenya_ecom
DB_USER=kenya_user
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5432

# Use PostgreSQL for local development
DATABASE_ENGINE=django.db.backends.postgresql

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0

# Allow all hosts for local
ALLOWED_HOSTS=localhost,127.0.0.1

# Email (console for testing)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Cloudinary (optional - use placeholder)
CLOUDINARY_NAME=placeholder
CLOUDINARY_KEY=placeholder
CLOUDINARY_SECRET=placeholder

# M-Pesa (use sandbox for testing)
MPESA_CONSUMER_KEY=test
MPESA_CONSUMER_SECRET=test
MPESA_PASSKEY=test
MPESA_ENV=sandbox
MPESA_CALLBACK_URL=http://localhost:8000/api/payments/mpesa/callback/
EOF

echo ".env file created!"

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Create superuser
echo "Creating admin user..."
python manage.py createsuperuser

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "To start the development server:"
echo "  python manage.py runserver"
echo ""
echo "Admin URL: http://localhost:8000/admin"
